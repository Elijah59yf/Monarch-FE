import { html, raw } from '../../../lib/html.js';
import { formatDate, t } from '../../i18n/index.js';
import { getJournalPost } from '../../strapi/index.js';
import { icon } from '../icons.js';
import { localizedPath } from '../paths.js';
import { blurUpImage } from './blur-up.js';

function shell(inner) {
    return html`
        <!-- Page Header (minimal for blog post) -->
        <section class="page-header" style="padding-bottom: var(--space-md);">
            <div class="container"></div>
        </section>

        <!-- Blog Post Content -->
        <section class="blog-section fade-in" id="post-content-wrapper">${inner}
        </section>`;
}

export async function render({ lang, settings, content, params }) {
    const business = settings['business.name'];
    const result = await getJournalPost(content, params.slug);

    if (result.status === 'not_found') return { notFound: true };

    if (result.status === 'unavailable') {
        return {
            nav: 'journal',
            status: 503,
            indexable: false,
            title: `${t(lang, 'nav.journal')} | ${business}`,
            description: t(lang, 'meta.post.description'),
            body: shell(html`
            <p class="loading-message">${t(lang, 'content.unavailable')}</p>`),
        };
    }

    const post = result.data;
    const title = post.title || t(lang, 'blog.untitled');
    return {
        nav: 'journal',
        title: `${title} | ${business}`,
        description: post.excerpt || t(lang, 'meta.post.description'),
        body: shell(html`
            <div class="container container-narrow fade-in" data-post-slug="${post.slug}">
                <div class="post-full-header">
                    <h1>${title}</h1>
                    <div class="post-meta">
                        <span>${icon('calendar')} ${formatDate(lang, post.date, settings['business.timezone'])}</span>
                        <span>${icon('user')} ${t(lang, 'blog.author')}</span>
                        <span class="reading-time">${icon('clock')} ${post.readingTime} ${t(lang, 'blog.minRead')}</span>
                    </div>
                </div>
                ${post.image ? html`<div class="post-full-image">${blurUpImage(post.image, title)}</div>` : ''}
                <div class="post-full-body">${raw(post.body)}</div>
                <a href="${localizedPath(lang, '/journal')}" class="btn" style="margin-top: 3rem;">${icon('arrow-left')} ${t(lang, 'blog.backToJournal')}</a>
            </div>`),
    };
}
