import { html, safeUrl } from '../../../lib/html.js';
import { t } from '../../i18n/index.js';
import { getProjects } from '../../strapi/index.js';
import { icon } from '../icons.js';
import { blurUpImage, delay } from './blur-up.js';

function card(project, index, lang) {
    // Only cards with an image get the tall featured treatment.
    const featured = index % 3 === 0 && !!project.image;
    return html`
                    <div class="project-card fade-in${featured ? ' featured' : ''}" style="${delay(index)}" data-tags="${project.tags.join(', ')}">
                        <div class="project-image">
                            ${project.image ? blurUpImage(project.image, project.title) : icon('folder')}
                        </div>
                        <div class="project-content">
                            <h3>${project.title}</h3>
                            <p>${project.description || t(lang, 'projects.defaultDescription')}</p>
                            <div class="project-tags">${project.tags.map((tag) => html`<span>${tag}</span>`)}</div>
                            <a href="${safeUrl(project.link)}" target="_blank" rel="noopener noreferrer" class="btn">
                                ${t(lang, 'projects.viewProject')} ${icon('external')}
                            </a>
                        </div>
                    </div>`;
}

export async function render({ lang, settings, content }) {
    const result = await getProjects(content);
    const projects = result.data ?? [];
    const tags = [...new Set(projects.flatMap((p) => p.tags))];

    let grid;
    if (result.status === 'unavailable') {
        grid = html`<div id="projects-grid-wrapper"><p class="loading-message">${t(lang, 'content.unavailable')}</p></div>`;
    } else if (projects.length === 0) {
        grid = html`<div id="projects-grid-wrapper"><p class="loading-message">${t(lang, 'projects.empty')}</p></div>`;
    } else {
        grid = html`<div id="projects-grid-wrapper" class="projects-grid">${projects.map((p, i) => card(p, i, lang))}
                </div>`;
    }

    return {
        nav: 'projects',
        status: result.status === 'unavailable' ? 503 : 200,
        title: `${t(lang, 'nav.projects')} | ${settings['business.name']}`,
        description: t(lang, 'meta.projects.description'),
        body: html`
        <!-- Page Header -->
        <section class="page-header fade-in">
            <div class="container">
                <h1>${t(lang, 'projects.title')}</h1>
                <p>${t(lang, 'projects.subtitle')}</p>
            </div>
        </section>

        <!-- Projects Grid -->
        <section class="projects-section fade-in">
            <div class="container" id="project-container">
                <!-- Filter Buttons -->
                <div class="project-filters" id="project-filters">
                    <button class="filter-btn active" data-filter="all">${t(lang, 'projects.filter.all')}</button>${tags.map((tag) => html`
                    <button class="filter-btn" data-filter="${tag}">${tag}</button>`)}
                </div>

                ${grid}
            </div>
        </section>`,
    };
}
