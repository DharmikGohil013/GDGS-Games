// ─── Stats Bar Component ───

export function createStatsBar() {
  const outer = document.createElement('div');
  outer.className = 'stats-outer';
  outer.id = 'stats-section';

  outer.innerHTML = `
    <div class="stats">
      <div class="stat">
        <b class="counter" data-target="1000">0</b>
        <span>Games</span>
      </div>
      <div class="stat">
        <b class="counter" data-target="50" data-suffix="M+">0</b>
        <span>Plays this month</span>
      </div>
      <div class="stat">
        <b class="counter" data-target="25">0</b>
        <span>Categories</span>
      </div>
      <div class="stat">
        <b>Weekly</b>
        <span>New drops</span>
      </div>
    </div>
  `;

  // Animate counters when visible
  let animated = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          animateCounters(outer);
          observer.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );

  // Observe after mount
  requestAnimationFrame(() => {
    observer.observe(outer);
  });

  return outer;
}

function animateCounters(container) {
  const counters = container.querySelectorAll('.counter');

  counters.forEach((counter) => {
    const target = parseInt(counter.dataset.target);
    const suffix = counter.dataset.suffix || '+';
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      if (target >= 1000) {
        counter.textContent = current.toLocaleString() + suffix;
      } else {
        counter.textContent = current + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  });
}
