// Scroll-reveal system — re-initialises on every astro:page-load
// (initial load + view-transition swaps).

function initReveal() {
  const els = document.querySelectorAll('.reveal:not(.is-visible)');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
  );
  els.forEach((el) => io.observe(el));
}

document.addEventListener('astro:page-load', initReveal);
