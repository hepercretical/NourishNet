import { AccountError } from '../auth/service.js';

const cookieName = 'nourishnet_session';
function readCookie(request) {
  const value = (request.headers.cookie || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  return value?.slice(cookieName.length + 1);
}
function cookie(value, age, secure) {
  return `${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${age}${secure ? '; Secure' : ''}`;
}
async function readBody(request) {
  if (!request.headers['content-type']?.startsWith('application/json'))
    throw new AccountError('Send a JSON request.', 415);
  let size = 0;
  const parts = [];
  for await (const part of request) {
    size += part.length;
    if (size > 8192) throw new AccountError('This request is too large.', 413);
    parts.push(part);
  }
  try {
    const body = JSON.parse(Buffer.concat(parts).toString('utf8'));
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error();
    return body;
  } catch {
    throw new AccountError('Check the form and try again.');
  }
}
function send(response, status, body) {
  response.writeHead(status);
  response.end(body === undefined ? undefined : JSON.stringify(body));
}

export function accountRoutes({ getServices, origin = 'http://127.0.0.1:5173' }) {
  const methods = {
    signup: 'POST',
    verify: 'POST',
    resend: 'POST',
    login: 'POST',
    session: 'GET',
    logout: 'POST',
    recover: 'POST',
    reset: 'POST',
  };
  return async function handle(request, response, url) {
    const action = url.pathname.startsWith('/api/auth/')
      ? url.pathname.slice('/api/auth/'.length)
      : null;
    const isAuth = action && Object.hasOwn(methods, action);
    const isDiary = url.pathname === '/api/diary';
    if (!isAuth && !['/api/foods', '/api/dashboard', '/api/diary'].includes(url.pathname))
      return false;
    try {
      const method = isAuth
        ? methods[action]
        : isDiary && request.method === 'POST'
          ? 'POST'
          : 'GET';
      if (request.method !== method) {
        response.setHeader('Allow', isDiary ? 'GET, POST' : method);
        throw new AccountError('Method not allowed', 405);
      }
      if (method === 'POST' && request.headers.origin !== origin)
        throw new AccountError('This action must come from the local app.', 403);
      const services = getServices();
      const sessionToken = readCookie(request);
      if (!isAuth) {
        const account = await services.auth.session(sessionToken);
        if (isDiary) {
          if (method === 'POST') {
            send(response, 201, await services.diary.create(account, await readBody(request)));
          } else {
            if (
              [...url.searchParams.keys()].some((key) => key !== 'date') ||
              url.searchParams.getAll('date').length !== 1
            )
              throw new AccountError('Select one local diary date.');
            send(response, 200, await services.diary.get(account, url.searchParams.get('date')));
          }
        } else if (url.pathname === '/api/foods') {
          const query = url.searchParams.get('q') ?? '';
          if (query.length > 100) throw new AccountError('Use at most 100 search characters.');
          send(response, 200, { foods: await services.foods.search(query) });
        } else {
          const date = new Intl.DateTimeFormat('en-CA', {
            timeZone: account.timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date());
          send(response, 200, {
            accountId: account.id,
            date,
            timeZone: account.timeZone,
            sharing: false,
            goal: null,
            totals: { calories: 0, protein: 0, fat: 0, carbohydrates: 0, sodium: 0 },
            meals: ['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((name) => ({ name, entries: [] })),
          });
        }
      } else if (action === 'session')
        send(response, 200, { account: await services.auth.session(sessionToken) });
      else if (action === 'logout') {
        await services.auth.logout(sessionToken);
        response.setHeader('Set-Cookie', cookie('', 0, origin.startsWith('https:')));
        send(response, 204);
      } else {
        const body = await readBody(request);
        const result = await services.auth[action](body);
        if (action === 'login') {
          response.setHeader(
            'Set-Cookie',
            cookie(result.sessionToken, 8 * 3600, origin.startsWith('https:')),
          );
          send(response, 200, { account: result.account });
        } else send(response, ['signup', 'resend', 'recover'].includes(action) ? 202 : 200, result);
      }
    } catch (error) {
      if (error.status === 401)
        response.setHeader('Set-Cookie', cookie('', 0, origin.startsWith('https:')));
      send(response, error instanceof AccountError ? error.status : 503, {
        error:
          error instanceof AccountError
            ? error.message
            : 'The local service is unavailable. Your form is kept; try again.',
      });
    }
    return true;
  };
}
