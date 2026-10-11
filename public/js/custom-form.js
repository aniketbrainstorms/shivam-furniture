import { waLink, msgCustomForm } from '../shared/messages.js';

const form = document.querySelector('[data-custom-form]');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  window.open(waLink(form.dataset.phone, msgCustomForm(data)), '_blank', 'noopener');
});
