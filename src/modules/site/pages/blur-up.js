import { html, safeUrl } from '../../../lib/html.js';

export function blurUpImage(src, alt) {
    const url = safeUrl(src, '');
    if (!url) return '';
    return html`<div class="blur-up-container"><img src="${url}" alt="${alt || ''}" class="lazy" loading="lazy"></div>`;
}

export function delay(index) {
    return `transition-delay: ${(index * 0.1).toFixed(1)}s`;
}
