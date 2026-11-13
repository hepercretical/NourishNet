import { createHostedApi } from '../../Backend/src/hostedApi.js';
import { neonVerifier } from '../../Backend/src/auth/neon.js';
import { hostedServices } from '../../Backend/src/services/hosted.js';

let services;
let verify;
export default async function handler(request) {
  const api = createHostedApi({
    origin: process.env.APP_ORIGIN,
    verify: (req) => (verify ??= neonVerifier())(req),
    getServices: () => (services ??= hostedServices()),
  });
  return api(request);
}
export const config = { path: '/api/*' };
