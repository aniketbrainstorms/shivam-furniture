export const waLink = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
export const telLink = (number) => `tel:+${number}`;

export const msgGeneral = () => "Hi Shivam Furniture! I'd like to enquire about your furniture.";

export const msgProduct = (name, finish) =>
  `Hi Shivam Furniture! I'm interested in the ${name}. Could you please share the price, dimensions, available materials/finishes and current availability?` +
  (finish ? ` I'm particularly interested in the ${finish} finish.` : '');

export const msgCustomiseProduct = (name, finish) =>
  `Hi Shivam Furniture! I like the ${name} and would like to customise it (size, finish or design). Could we talk about it?` +
  (finish ? ` I'm thinking of the ${finish} finish.` : '');

export const msgCustomSkip = () => "Hi Shivam Furniture! I'd like to discuss a custom furniture order.";

export function msgCustomForm({ type, size, finish, room, notes }) {
  const lines = ["Hi Shivam Furniture! I'd like to discuss a custom furniture order."];
  if (type) lines.push(`Type of furniture: ${type}`);
  if (size) lines.push(`Approximate size: ${size}`);
  if (finish) lines.push(`Preferred finish: ${finish}`);
  if (room) lines.push(`Room: ${room}`);
  if (notes) lines.push(`Notes: ${notes}`);
  lines.push("I'll share reference photos in this chat.");
  return lines.join('\n');
}
