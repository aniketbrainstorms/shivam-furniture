import { html } from '../../lib/html.js';
import { breadcrumbLd } from '../../lib/seo.js';
import { layout } from '../layout.js';
import { picture, bottomBar, waSvg, ROOMS } from '../components.js';
import { waLink, msgCustomSkip } from '../../../shared/messages.js';

const TYPES = ['Bed', 'Sofa', 'Dining table', 'Wardrobe', 'Study table', 'Bookshelf', 'TV unit', 'Other'];

export function pages(ctx) {
  const s = ctx.settings;
  const body = html`<div class="wrap">
  <section class="section-tight" style="padding-top:28px">
    <p class="eyebrow">Custom furniture</p>
    <h1 class="serif" style="font-size:clamp(2.2rem,7vw,3.6rem)">Your vision. Our craft.</h1>
    <p class="lead">Have a specific design, size or finish in mind? We make custom furniture tailored to your space, preferences and everyday needs.</p>
  </section>

  <section class="section-tight">
    <h2 class="serif">Tell us what you have in mind</h2>
    <p class="lead">Answer what you can. Your answers open in WhatsApp, ready to send. You can attach inspiration photos in the chat once it opens.</p>
    <form class="form" data-custom-form data-phone="${s.phone}">
      <label>What would you like made?<select class="field" name="type"><option value="">Choose one</option>${TYPES.map((t) => html`<option>${t}</option>`)}</select></label>
      <label>Approximate size<input class="field" name="size" placeholder="e.g. 6 ft wide, or the wall measurement"></label>
      <label>Preferred finish or wood<input class="field" name="finish" placeholder="e.g. walnut, natural, not sure"></label>
      <label>Which room is it for?<select class="field" name="room"><option value="">Choose one</option>${Object.values(ROOMS).map((r) => html`<option>${r}</option>`)}</select></label>
      <label>Anything else?<textarea class="field" name="notes" rows="3" placeholder="Storage needs, style, deadline"></textarea></label>
      <div class="btn-row"><button class="btn btn-wa" type="submit">${waSvg()} Send on WhatsApp</button><a class="btn btn-ghost" href="${waLink(s.phone, msgCustomSkip())}" rel="noopener">Skip, chat on WhatsApp</a></div>
    </form>
  </section>

  <section class="section">
    <h2 class="serif">How it works</h2>
    <ol class="steps">
      <li><strong>Tell us what you have in mind.</strong><br><span class="muted">Use the form above, or message us directly.</span></li>
      <li><strong>Talk it through with our team.</strong><br><span class="muted">On WhatsApp, on a call or at the showroom. We finalise the design and price together.</span></li>
      <li><strong>We make it in our workshop.</strong><br><span class="muted">Built by hands, with care for the materials and finishing.</span></li>
    </ol>
  </section>

  ${ctx.gallery.length ? html`<section class="section" id="custom-gallery"><h2 class="serif">Made for customers</h2><div class="grid">${ctx.gallery.map((g) => html`<figure style="margin:0"><div class="media">${picture(ctx, { path: g.path, alt: g.caption }, { sizes: '(min-width:700px) 33vw, 50vw' })}</div>${g.caption ? html`<figcaption class="card-meta" style="padding:8px 0">${g.caption}</figcaption>` : ''}</figure>`)}</div></section>` : ''}
</div>`;

  return [{
    path: '/custom/',
    html: layout(ctx, {
      title: 'Custom Furniture in Guwahati | Shivam Furniture',
      description: 'Custom wooden furniture made to your size, design and finish at Shivam Furniture, Guwahati. Share your idea on WhatsApp, call us or visit the showroom.',
      path: '/custom/',
      current: 'custom',
      scripts: ['/js/custom-form.js'],
      bar: bottomBar(ctx),
      jsonLd: [breadcrumbLd(ctx.site, [['Home', '/'], ['Custom furniture', '/custom/']])],
      body,
    }),
  }];
}
