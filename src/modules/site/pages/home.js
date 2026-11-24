import { html } from '../../../lib/html.js';
import { t } from '../../i18n/index.js';
import { HERO_MARK } from '../../../data/site.js';
import { icon } from '../icons.js';
import { localizedPath } from '../paths.js';

const CARDS = [
    { key: 'about', icon: 'user', path: '/about' },
    { key: 'expertise', icon: 'shapes', path: '/services' },
    { key: 'work', icon: 'idea', path: '/projects' },
];

export async function render({ lang, settings }) {
    const link = (path) => localizedPath(lang, path);
    return {
        nav: 'home',
        title: t(lang, 'meta.home.title', { business: settings['business.name'] }),
        description: t(lang, 'meta.home.description'),
        body: html`
        <!-- Hero - Asymmetric Split -->
        <section class="hero">
            <div class="hero-content">
                <span class="hero-tagline">${t(lang, 'hero.tagline')}</span>
                <h1>${t(lang, 'hero.title')}</h1>
                <p>${t(lang, 'hero.description')}</p>
                <a href="${link('/about')}" class="btn">
                    <span>${t(lang, 'hero.cta')}</span>
                    ${icon('arrow-right')}
                </a>
            </div>
            <div class="hero-visual">
                <span class="vertical-text">${HERO_MARK}</span>
            </div>
        </section>

        <!-- Explore Section -->
        <section class="explore-section fade-in">
            <div class="container">
                <div class="section-header">
                    <span class="label">${t(lang, 'explore.label')}</span>
                    <h2>${t(lang, 'explore.title')}</h2>
                    <p>${t(lang, 'explore.subtitle')}</p>
                </div>

                <div class="explore-grid fade-in-stagger">${CARDS.map((card) => html`
                    <div class="explore-card">
                        <div class="explore-icon">
                            ${icon(card.icon)}
                        </div>
                        <h3>${t(lang, `explore.${card.key}.title`)}</h3>
                        <p>${t(lang, `explore.${card.key}.desc`)}</p>
                        <a href="${link(card.path)}" class="card-link">
                            <span>${t(lang, `explore.${card.key}.link`)}</span> ${icon('arrow-right')}
                        </a>
                    </div>`)}
                </div>
            </div>
        </section>`,
    };
}
