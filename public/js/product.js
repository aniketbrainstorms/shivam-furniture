import { waLink, msgProduct, msgCustomiseProduct } from '/shared/messages.js';

const root = document.querySelector('[data-product]');
if (root) {
  const { phone, name } = root.dataset;
  let finish = '';

  const refresh = () => {
    document.querySelectorAll('[data-wa="product"]').forEach((a) => (a.href = waLink(phone, msgProduct(name, finish))));
    document.querySelectorAll('[data-wa="customise"]').forEach((a) => (a.href = waLink(phone, msgCustomiseProduct(name, finish))));
  };

  const swatches = [...root.querySelectorAll('[data-finish]')];
  const label = root.querySelector('[data-finish-label]');
  swatches.forEach((b) =>
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      swatches.forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', String(on));
      finish = on ? b.dataset.finish : '';
      if (label) label.textContent = finish ? `Selected: ${finish}` : '';
      refresh();
    }),
  );

  const share = root.querySelector('[data-share]');
  share?.addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        share.textContent = 'Link copied';
      }
    } catch { /* user cancelled the share sheet */ }
  });
}
