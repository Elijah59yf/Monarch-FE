import { html } from '../../../lib/html.js';
import { t, tHtml } from '../../i18n/index.js';
import { CV_PATH, PROFILE_IMAGE, SKILLS } from '../../../data/site.js';
import { icon } from '../icons.js';

export async function render({ lang, settings }) {
    return {
        nav: 'about',
        title: `${t(lang, 'nav.about')} | ${settings['business.name']}`,
        description: t(lang, 'meta.about.description'),
        body: html`
        <!-- Page Header -->
        <section class="page-header fade-in">
            <div class="container">
                <h1>${t(lang, 'about.title')}</h1>
                <p>${t(lang, 'about.subtitle')}</p>
            </div>
        </section>

        <!-- About Content -->
        <section class="about-section fade-in">
            <div class="container">
                <div class="about-grid">
                    <div class="about-text">
                        <h2>${t(lang, 'about.name')}</h2>
                        <p>${tHtml(lang, 'about.intro')}</p>

                        <p>${t(lang, 'about.philosophy')}</p>

                        <div class="skills-section-inner">
                            <h3>${t(lang, 'about.skills.title')}</h3>
${SKILLS.map((skill) => html`
                            <div class="skill-bar-item" data-skill="${skill.level}">
                                <div class="skill-bar-header">
                                    <span class="skill-name">${icon(skill.icon)} <span>${t(lang, `about.skill.${skill.key}`)}</span></span>
                                    <span class="skill-percent">0%</span>
                                </div>
                                <div class="skill-bar-track">
                                    <div class="skill-bar-fill"></div>
                                </div>
                            </div>
`)}
                        </div>

                        <p>${t(lang, 'about.goal')}</p>

                        <a href="${CV_PATH}" download class="btn">
                            <span>${t(lang, 'about.cv')}</span>
                            ${icon('download')}
                        </a>
                    </div>

                    <div class="about-image">
                        <img src="${PROFILE_IMAGE}" alt="${t(lang, 'about.photoAlt')}">
                    </div>
                </div>
            </div>
        </section>`,
    };
}
