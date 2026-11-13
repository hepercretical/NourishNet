let transport;
// Isolated design-test harness only. Query strings cannot install a transport,
// and production builds never dispatch through it. No fixture data lives here.
export function installPreviewTransport(next) {
  if (import.meta.env.DEV) transport = next;
  return () => {
    if (transport === next) transport = undefined;
  };
}
export function getPreviewTransport() {
  return import.meta.env.DEV ? transport : undefined;
}
