import { html } from '../../../lib/html.js';
import { t } from '../../i18n/index.js';
import { SERVICES } from '../../../data/site.js';
import { icon } from '../icons.js';

export async function render({ lang, settings }) {
    return {
        nav: 'services',
        title: `${t(lang, 'nav.services')} | ${settings['business.name']}`,
        description: t(lang, 'meta.services.description'),
        body: html`
        <!-- Page Header -->
        <section class="page-header fade-in">
            <div class="container">
                <h1>${t(lang, 'services.title')}</h1>
                <p>${t(lang, 'services.subtitle')}</p>
            </div>
        </section>

        <!-- Services Grid -->
        <section class="services-section fade-in">
            <div class="container">
                <div class="section-header">
                    <span class="label">${t(lang, 'services.label')}</span>
                    <h2>${t(lang, 'services.heading')}</h2>
                    <p>${t(lang, 'services.description')}</p>
                </div>

                <div class="services-grid fade-in-stagger">${SERVICES.map((service) => html`
                    <div class="service-card">
                        <span class="service-icon">${icon(service.icon)}</span>
                        <h3>${t(lang, `services.${service.key}.title`)}</h3>
                        <p>${t(lang, `services.${service.key}.desc`)}</p>
                    </div>`)}
                </div>
            </div>
        </section>`,
    };
}
