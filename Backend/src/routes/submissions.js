import { AccountError } from '../auth/service.js';
import { submissionBodyLimit } from '../db/submissionValidation.js';

async function readBody(request) {
  if (!request.headers['content-type']?.startsWith('application/json'))
    throw new AccountError('Send JSON.', 415);
  let size = 0;
  const parts = [];
  for await (const part of request) {
    size += part.length;
    if (size > submissionBodyLimit) throw new AccountError('These photos are too large.', 413);
    parts.push(part);
  }
  try {
    return JSON.parse(Buffer.concat(parts).toString('utf8'));
  } catch {
    throw new AccountError('Check the submission fields and photos.');
  }
}
export function submissionRoutes({ getServices, origin }) {
  return async (request, response, url) => {
    const collection = url.pathname === '/api/submissions';
    const match = url.pathname.match(
      /^\/api\/submissions\/([0-9a-f-]+)(?:\/photos\/(front|label))?$/i,
    );
    if (!collection && !match) return false;
    try {
      const methods = collection ? ['GET', 'POST'] : match[2] ? ['GET'] : ['GET', 'PATCH'];
      if (!methods.includes(request.method)) {
        response.setHeader('Allow', methods.join(', '));
        throw new AccountError('Method not allowed.', 405);
      }
      if (url.search) throw new AccountError('Submission routes do not accept query parameters.');
      if (request.method !== 'GET' && request.headers.origin !== origin)
        throw new AccountError('Use the local app.', 403);
      const services = getServices();
      const token = (request.headers.cookie || '')
        .split(';')
        .map((x) => x.trim())
        .find((x) => x.startsWith('nourishnet_session='))
        ?.slice('nourishnet_session='.length);
      const account = await services.auth.session(token);
      if (match?.[2]) {
        const photo = await services.submissions.photo(account, match[1], match[2]);
        response.setHeader('Content-Type', photo.mime);
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.writeHead(200);
        response.end(photo.bytes);
        return true;
      }
      const body = collection
        ? request.method === 'GET'
          ? await services.submissions.list(account)
          : await services.submissions.create(account, await readBody(request))
        : request.method === 'GET'
          ? await services.submissions.get(account, match[1])
          : await services.submissions.correct(account, match[1], await readBody(request));
      response.writeHead(request.method === 'POST' ? 201 : 200);
      response.end(JSON.stringify(body));
    } catch (error) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.writeHead(error instanceof AccountError ? error.status : 503);
      response.end(
        JSON.stringify({
          error:
            error instanceof AccountError
              ? error.message
              : 'The submission service is unavailable. Your choices are kept; try again.',
        }),
      );
    }
    return true;
  };
}
