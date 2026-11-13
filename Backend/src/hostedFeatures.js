import { AccountError } from './auth/service.js';

const personalMethods = {
  goals: ['GET', 'POST'],
  stats: ['GET'],
  weights: ['GET', 'POST'],
  appearance: ['GET', 'PUT'],
  profile: ['PATCH'],
  notifications: ['GET'],
};

export function hostedFeature(url) {
  const path = url.pathname;
  if (path === '/api/foods/barcode') return { kind: 'barcode', methods: ['GET'] };
  if (path === '/api/submissions') return { kind: 'submissions', methods: ['GET', 'POST'] };
  const submission = path.match(/^\/api\/submissions\/([0-9a-f-]+)(?:\/photos\/(front|label))?$/i);
  if (submission)
    return {
      kind: 'submission',
      id: submission[1],
      photo: submission[2],
      methods: submission[2] ? ['GET'] : ['GET', 'PATCH'],
    };
  const action = path.slice('/api/personal/'.length);
  if (path.startsWith('/api/personal/') && Object.hasOwn(personalMethods, action))
    return { kind: 'personal', action, methods: personalMethods[action] };
  return null;
}

export async function runHostedFeature(feature, { request, url, services, account, bodyOf, json }) {
  const get = request.method === 'GET';
  const { kind, action } = feature;
  let expected = [];
  if (kind === 'barcode') expected = ['code'];
  if (kind === 'personal' && get)
    expected =
      action === 'goals' ? ['date'] : ['stats', 'weights'].includes(action) ? ['from', 'to'] : [];
  if ([...url.searchParams.keys()].sort().join(',') !== expected.sort().join(','))
    throw new AccountError('Supply only the required query parameters.');
  if (kind === 'barcode')
    return json(await services.foods.lookupBarcode(url.searchParams.get('code')));
  if (kind === 'submission' && feature.photo) {
    const photo = await services.submissions.photo(account, feature.id, feature.photo);
    return new Response(photo.bytes, {
      headers: {
        'Content-Type': photo.mime,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
  if (kind === 'submissions' || kind === 'submission') {
    if (get)
      return json(
        await services.submissions[kind === 'submissions' ? 'list' : 'get'](
          account,
          ...(feature.id ? [feature.id] : []),
        ),
      );
    const body = await bodyOf(request, 5_800_000);
    return json(
      kind === 'submissions'
        ? await services.submissions.create(account, body)
        : await services.submissions.correct(account, feature.id, body),
      kind === 'submissions' ? 201 : 200,
    );
  }
  const personal = services.personal;
  const body = get ? undefined : await bodyOf(request);
  const date = url.searchParams.get('date'),
    from = url.searchParams.get('from'),
    to = url.searchParams.get('to');
  switch (action) {
    case 'goals':
      return json(
        get ? await personal.getGoal(account, date) : await personal.saveGoal(account, body),
      );
    case 'stats':
      return json(await personal.stats(account, from, to));
    case 'weights':
      return json(
        get ? await personal.weights(account, from, to) : await personal.saveWeight(account, body),
      );
    case 'appearance':
      return json(
        get ? await personal.appearance(account) : await personal.saveAppearance(account, body),
      );
    case 'profile':
      return json(await personal.profile(account, body));
    case 'notifications':
      return json(await services.submissions.list(account));
  }
}
