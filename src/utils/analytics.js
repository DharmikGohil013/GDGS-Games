// Keep analytics calls optional so gameplay still works when the tag is blocked.
export function trackEvent(name, parameters = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, parameters);
  }
}
