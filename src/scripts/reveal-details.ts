import '../styles/reveal-details.css';

/** Reveal on scroll or manual opening; manual closing is immediate. */
export function revealDetailsOnScroll(selector: string, bodySelector: string) {
  let activeDetails: HTMLDetailsElement | null = null;
  let cleanup = () => {};

  function reveal() {
    const details = document.querySelector<HTMLDetailsElement>(selector);
    if (details === activeDetails) return;
    cleanup();
    activeDetails = details;
    const title = details?.querySelector('summary strong');
    const summary = details?.querySelector('summary');
    const body = details?.querySelector<HTMLElement>(bodySelector);
    if (!details || !title || !summary || !body || !('IntersectionObserver' in window)) return;

    // Leave space below the title so the expansion is visible on screen.
    const revealSpace = 96;
    details.dataset.scrollReveal = '';
    details.open = false;
    let animation: Animation | null = null;
    const finishReveal = () => {
      delete details.dataset.revealing;
      animation = null;
    };
    const cancelReveal = () => {
      animation?.cancel();
      finishReveal();
    };
    const openDetails = () => {
      cancelReveal();
      const animate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (animate) details.dataset.revealing = '';
      details.open = true;
      if (!animate) return;
      animation = body.animate([
        { height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0, overflow: 'hidden' },
        { height: getComputedStyle(body).height, paddingTop: getComputedStyle(body).paddingTop,
          paddingBottom: getComputedStyle(body).paddingBottom, opacity: 1, overflow: 'hidden' },
      ], { duration: 450, easing: 'ease-out' });
      const current = animation;
      animation.finished.then(() => {
        if (animation === current) finishReveal();
      }, () => {});
    };
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      stopObserving();
      openDetails();
    }, { rootMargin: `0px 0px -${revealSpace}px 0px`, threshold: 1 });
    const stopObserving = () => {
      observer.disconnect();
    };
    const toggleDetails = (event: MouseEvent) => {
      // A download inside the summary must retain its normal link behavior.
      if (event.target instanceof Element && event.target.closest('a, button, input, select, textarea')) return;
      event.preventDefault();
      stopObserving();
      if (details.open) {
        cancelReveal();
        details.open = false;
      } else {
        openDetails();
      }
    };
    cleanup = () => {
      stopObserving();
      cancelReveal();
      summary.removeEventListener('click', toggleDetails);
      delete details.dataset.scrollReveal;
    };
    // Manual toggles take precedence over any later scroll reveal.
    summary.addEventListener('click', toggleDetails);
    observer.observe(title);
  }

  reveal();
  document.addEventListener('astro:page-load', reveal);
  document.addEventListener('astro:before-swap', () => {
    cleanup();
    activeDetails = null;
  });
}
