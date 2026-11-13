// Explicit opt-in: a broken hosted configuration must never fall back to local auth.
export const usesNeonAuth = import.meta.env.VITE_AUTH_MODE === 'neon';
