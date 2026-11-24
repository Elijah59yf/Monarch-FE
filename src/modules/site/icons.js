import { html } from '../../lib/html.js';
import { ICON_SPRITE } from '../../data/site.js';

export function icon(name) {
    return html`<svg class="icon icon-${name}" aria-hidden="true"><use href="${ICON_SPRITE}#i-${name}"/></svg>`;
}
