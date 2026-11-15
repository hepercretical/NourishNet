import { AccountError } from './auth/service.js';
import { hostedFeature, runHostedFeature } from './hostedFeatures.js';

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  });
}
async function bodyOf(request, limit = 8192) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new AccountError('Send JSON.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new AccountError('Send a JSON body.');
  let length = 0;
  const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new AccountError('This request is too large.', 413);
      }
      chunks.push(Buffer.from(value));
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch (error) {
    if (error instanceof AccountError) throw error;
    throw new AccountError('Check the JSON body.');
  } finally {
    reader.releaseLock();
  }
}

export function createHostedApi({ verify, getServices, origin, allowGuest = false }) {
  return async (request) => {
    const url = new URL(request.url);
    const path = url.pathname;
    const feature = hostedFeature(url);
    const entry = path.match(/^\/api\/diary\/entries\/([0-9a-f-]+)$/i);
    const methods =
      feature?.methods ??
      (path === '/api/diary'
        ? ['GET', 'POST']
        : ['/api/auth/profile', '/api/auth/guest', '/api/auth/logout'].includes(path)
          ? ['POST']
          : entry
            ? ['PATCH', 'DELETE']
            : ['/api/health', '/api/auth/session', '/api/foods'].includes(path)
              ? ['GET']
              : null);
    if (!methods) return json({ error: 'Not found' }, 404);
    if (!methods.includes(request.method))
      return json({ error: 'Method not allowed' }, 405, { Allow: methods.join(', ') });
    if (path === '/api/health') return json({ status: 'ok' });
    try {
      if (request.method !== 'GET' && request.headers.get('origin') !== origin)
        throw new AccountError('Use the approved app origin.', 403);
      if (path === '/api/auth/guest' && !allowGuest)
        throw new AccountError('Guest testing is disabled.', 404);
      const services = getServices();
      const guestCookie = (request.headers.get('cookie') || '')
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('nourishnet_guest='))
        ?.slice('nourishnet_guest='.length);
      const cookie = (value, age) =>
        `nourishnet_guest=${value}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=${age}`;
      if (path === '/api/auth/guest') {
        const body = await bodyOf(request);
        const result = await services.guestAuth.guest(body);
        return json({ account: result.account }, 200, {
          'Set-Cookie': cookie(result.sessionToken, 8 * 3600),
        });
      }
      if (path === '/api/auth/logout') {
        if (guestCookie) await services.guestAuth.logout(guestCookie);
        return new Response(null, {
          status: 204,
          headers: { 'Cache-Control': 'no-store', 'Set-Cookie': cookie('', 0) },
        });
      }
      // Bearer-authenticated accounts never inherit another guest's cookie.
      const guest = allowGuest && guestCookie && !request.headers.has('authorization');
      const identity = guest ? null : await verify(request);
      if (path === '/api/auth/profile' && guest)
        throw new AccountError('Guest accounts do not need onboarding.', 400);
      if (path === '/api/auth/profile')
        return json({ account: await services.accounts.onboard(identity, await bodyOf(request)) });
      const account = guest
        ? await services.guestAuth.session(guestCookie)
        : await services.accounts.find(identity);
      if (path === '/api/auth/session') return json({ account, needsProfile: !account });
      if (!account) throw new AccountError('Complete your account setup.', 403);
      if (feature)
        return await runHostedFeature(feature, { request, url, services, account, bodyOf, json });
      if (path === '/api/foods') {
        const query = url.searchParams.get('q') ?? '';
        if (query.length > 100) throw new AccountError('Use at most 100 search characters.');
        return json({ foods: await services.foods.search(query) });
      }
      if (entry) {
        if (url.search) throw new AccountError('Send entry changes in the JSON body.');
        return json(
          await services.diary[request.method === 'PATCH' ? 'update' : 'remove'](
            account,
            entry[1],
            await bodyOf(request),
          ),
        );
      }
      if (request.method === 'POST')
        return json(await services.diary.create(account, await bodyOf(request)), 201);
      if ([...url.searchParams.keys()].join(',') !== 'date')
        throw new AccountError('Choose one diary date.');
      return json(await services.diary.get(account, url.searchParams.get('date')));
    } catch (error) {
      return json(
        {
          error:
            error instanceof AccountError
              ? error.message
              : 'The service is unavailable. Try again.',
        },
        error instanceof AccountError ? error.status : 503,
      );
    }
  };
}
