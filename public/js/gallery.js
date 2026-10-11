const gallery = document.querySelector('[data-gallery]');
if (gallery) {
  const track = gallery.querySelector('[data-track]');
  const slides = [...track.children];
  const thumbs = [...gallery.querySelectorAll('[data-thumb]')];
  const dialog = gallery.querySelector('[data-lightbox]');

  const setActive = (i) => thumbs.forEach((t, n) => t.setAttribute('aria-current', String(n === i)));
  track.style.position = 'relative';
  thumbs.forEach((t, i) => t.addEventListener('click', () => track.scrollTo({ left: slides[i].offsetLeft, behavior: 'smooth' })));

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setActive(slides.indexOf(e.target))),
    { root: track, threshold: 0.6 },
  );
  slides.forEach((s) => io.observe(s));

  gallery.querySelectorAll('[data-zoom]').forEach((b) =>
    b.addEventListener('click', () => {
      dialog.querySelector('img').src = b.dataset.zoom;
      dialog.showModal();
    }),
  );
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.hasAttribute('data-close')) dialog.close();
  });
}
