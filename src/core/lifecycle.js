// ─── Page lifecycle ───
// Components register teardown here; the router flushes it before it wipes #app.
// Without this, listeners on window/document would pile up on every route change.

const cleanups = new Set();

export function onUnmount(fn) {
  cleanups.add(fn);
  return () => cleanups.delete(fn);
}

export function runUnmounts() {
  cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('Cleanup failed:', e);
    }
  });
  cleanups.clear();
}
