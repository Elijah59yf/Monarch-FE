import { html } from '../../../lib/html.js';
import { t } from '../../i18n/index.js';
import { icon } from '../icons.js';
import { localizedPath } from '../paths.js';

function page(lang, settings, titleKey, textKey, status) {
    return {
        nav: null,
        status,
        indexable: false,
        title: `${t(lang, titleKey)} | ${settings['business.name']}`,
        description: t(lang, textKey),
        body: html`
        <section class="page-header fade-in">
            <div class="container">
                <h1>${t(lang, titleKey)}</h1>
                <p>${t(lang, textKey)}</p>
            </div>
        </section>

        <section class="blog-section fade-in">
            <div class="container container-narrow">
                <a href="${localizedPath(lang, '/')}" class="btn">${icon('arrow-left')} ${t(lang, 'notFound.cta')}</a>
            </div>
        </section>`,
    };
}

export function notFound({ lang, settings }) {
    return page(lang, settings, 'notFound.title', 'notFound.text', 404);
}

export function serverError({ lang, settings }) {
    return page(lang, settings, 'error.title', 'error.text', 500);
}
