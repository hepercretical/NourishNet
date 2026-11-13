import { AccountError } from '../auth/service.js';

export function personalRoutes({ getServices, origin = 'http://127.0.0.1:5173' }) {
  const routes = {
    goals: ['GET', 'POST'],
    stats: ['GET'],
    weights: ['GET', 'POST'],
    appearance: ['GET', 'PUT'],
    profile: ['PATCH'],
    notifications: ['GET'],
    password: ['POST'],
  };
  return async (request, response, url) => {
    if (!url.pathname.startsWith('/api/personal/')) return false;
    const action = url.pathname.slice('/api/personal/'.length);
    const send = (status, body) => {
      response.writeHead(status);
      response.end(JSON.stringify(body));
    };
    try {
      if (!Object.hasOwn(routes, action)) throw new AccountError('Not found', 404);
      if (!routes[action].includes(request.method)) {
        response.setHeader('Allow', routes[action].join(', '));
        throw new AccountError('Method not allowed', 405);
      }
      const services = getServices();
      const cookie = (request.headers.cookie || '')
        .split(';')
        .map((s) => s.trim())
        .find((s) => s.startsWith('nourishnet_session='))
        ?.slice('nourishnet_session='.length);
      const account = await services.auth.session(cookie);
      if (!services.personal)
        throw new AccountError('Personal tracking is unavailable in this environment.', 503);
      let body;
      if (request.method !== 'GET') {
        if (request.headers.origin !== origin)
          throw new AccountError('Use the local app for this action.', 403);
        if (url.search) throw new AccountError('Send changes in the JSON body.');
        if (!request.headers['content-type']?.startsWith('application/json'))
          throw new AccountError('Send JSON.', 415);
        const parts = [];
        let size = 0;
        for await (const part of request) {
          size += part.length;
          if (size > 8192) throw new AccountError('Request too large.', 413);
          parts.push(part);
        }
        try {
          body = JSON.parse(Buffer.concat(parts).toString('utf8'));
        } catch {
          throw new AccountError('Check your entries.');
        }
      }
      const expected =
        request.method === 'GET'
          ? action === 'goals'
            ? ['date']
            : ['stats', 'weights'].includes(action)
              ? ['from', 'to']
              : []
          : [];
      if ([...url.searchParams.keys()].sort().join() !== expected.sort().join())
        throw new AccountError('Supply only the required date parameters.');
      let result;
      if (action === 'goals')
        result =
          request.method === 'GET'
            ? await services.personal.getGoal(account, url.searchParams.get('date'))
            : await services.personal.saveGoal(account, body);
      if (action === 'stats')
        result = await services.personal.stats(
          account,
          url.searchParams.get('from'),
          url.searchParams.get('to'),
        );
      if (action === 'weights')
        result =
          request.method === 'GET'
            ? await services.personal.weights(
                account,
                url.searchParams.get('from'),
                url.searchParams.get('to'),
              )
            : await services.personal.saveWeight(account, body);
      if (action === 'appearance')
        result =
          request.method === 'GET'
            ? await services.personal.appearance(account)
            : await services.personal.saveAppearance(account, body);
      if (action === 'profile') result = await services.personal.profile(account, body);
      if (action === 'notifications') result = await services.submissions.list(account);
      if (action === 'password') result = await services.personal.password(account, body);
      send(200, result);
    } catch (error) {
      send(error instanceof AccountError ? error.status : 503, {
        error:
          error instanceof AccountError
            ? error.message
            : 'Your changes could not be completed. Your input is kept; try again.',
      });
    }
    return true;
  };
}
