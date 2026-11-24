import { html } from '../../../lib/html.js';
import { formatDate, plural, t } from '../../i18n/index.js';
import { getJournalList } from '../../strapi/index.js';
import { icon } from '../icons.js';
import { journalPostPath, localizedPath } from '../paths.js';
import { blurUpImage, delay } from './blur-up.js';

function preview(post, index, { lang, settings }) {
    const href = localizedPath(lang, journalPostPath(post.slug));
    return html`
                <article class="blog-post-preview fade-in${post.image ? '' : ' no-image'}" style="${delay(index)}">
                    ${post.image ? html`<a href="${href}">${blurUpImage(post.image, post.title)}</a>` : ''}
                    <div class="post-info">
                        <div class="post-meta">
                            <span>${icon('calendar')} ${formatDate(lang, post.date, settings['business.timezone'])}</span>
                            <span class="reading-time">${icon('clock')} ${post.readingTime} ${t(lang, 'blog.minRead')}</span>
                            <span class="view-count" data-view-slug="${post.slug}">${icon('eye')} ${plural(lang, 'blog.viewCount', 0)}</span>
                        </div>
                        <h2><a href="${href}">${post.title}</a></h2>
                        ${post.excerpt ? html`<p>${post.excerpt}</p>` : ''}
                        <a href="${href}" class="btn">${t(lang, 'blog.readArticle')} ${icon('arrow-right')}</a>
                    </div>
                </article>`;
}

export async function render(ctx) {
    const { lang, settings, content } = ctx;
    const result = await getJournalList(content);
    const posts = result.data ?? [];

    let list;
    if (result.status === 'unavailable') {
        list = html`<div id="blog-posts-wrapper"><p class="loading-message">${t(lang, 'content.unavailable')}</p></div>`;
    } else if (posts.length === 0) {
        list = html`<div id="blog-posts-wrapper"><p class="loading-message">${t(lang, 'blog.empty')}</p></div>`;
    } else {
        list = html`<div id="blog-posts-wrapper" class="blog-list">${posts.map((p, i) => preview(p, i, ctx))}
                </div>`;
    }

    return {
        nav: 'journal',
        status: result.status === 'unavailable' ? 503 : 200,
        title: `${t(lang, 'nav.journal')} | ${settings['business.name']}`,
        description: t(lang, 'meta.journal.description'),
        body: html`
        <!-- Page Header -->
        <section class="page-header fade-in">
            <div class="container">
                <h1>${t(lang, 'blog.title')}</h1>
                <p>${t(lang, 'blog.subtitle')}</p>
            </div>
        </section>

        <!-- Blog List -->
        <section class="blog-section fade-in">
            <div class="container container-narrow" id="blog-container">
                <!-- Expandable Search -->
                <div class="search-wrapper">
                    <button class="search-toggle" id="search-toggle" aria-label="${t(lang, 'a11y.searchToggle')}">
                        ${icon('search')}
                    </button>
                    <div class="search-box">
                        <input type="text" id="blog-search" placeholder="${t(lang, 'blog.search')}" autocomplete="off">
                        <button class="search-clear" id="search-clear" aria-label="${t(lang, 'a11y.searchClear')}">
                            ${icon('close')}
                        </button>
                    </div>
                </div>
                <p class="search-results-count" id="search-results-count"></p>

                ${list}
            </div>
        </section>`,
    };
}
