// This marker selects the cookie transport; it grants no access. The API always
// validates the HttpOnly session. No identity, token or diary is stored here.
const key = 'nourishnet:guest-testing';
let active = false;
export function usesGuestSession() {
  try {
    return active || sessionStorage.getItem(key) === 'true';
  } catch {
    return active;
  }
}
export function setGuestSession(value) {
  active = value;
  try {
    if (value) sessionStorage.setItem(key, 'true');
    else sessionStorage.removeItem(key);
  } catch {
    // The current page still works when storage is unavailable.
  }
}
