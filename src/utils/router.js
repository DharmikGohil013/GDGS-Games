// ─── Simple hash-based router ───
const routes = new Map();
let currentRoute = '';

export function onRoute(pattern, handler) {
  routes.set(pattern, handler);
}

export function navigate(hash) {
  window.location.hash = hash;
}

export function getCurrentRoute() {
  return window.location.hash.slice(1) || '/';
}

export function initRouter() {
  function handleRoute() {
    const hash = getCurrentRoute();
    if (hash === currentRoute) return;
    currentRoute = hash;

    for (const [pattern, handler] of routes) {
      if (hash === pattern || hash.startsWith(pattern + '/')) {
        handler(hash);
        return;
      }
    }
    // Default route
    const defaultHandler = routes.get('/');
    if (defaultHandler) defaultHandler(hash);
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
