import * as home from './pages/home.js';
import * as about from './pages/about.js';
import * as services from './pages/services.js';
import * as projects from './pages/projects.js';
import * as journal from './pages/journal.js';
import * as journalPost from './pages/journal-post.js';

// Language-neutral paths. Each is served under /en, /ja and /de.
const STATIC_PAGES = {
    '/': home,
    '/about': about,
    '/services': services,
    '/projects': projects,
    '/journal': journal,
};

export const SITEMAP_PATHS = Object.keys(STATIC_PAGES);

const JOURNAL_POST = /^\/journal\/([^/]+)$/;

export function matchPage(path) {
    if (Object.hasOwn(STATIC_PAGES, path)) return { page: STATIC_PAGES[path], params: {} };
    const post = JOURNAL_POST.exec(path);
    if (post) {
        try {
            return { page: journalPost, params: { slug: decodeURIComponent(post[1]) } };
        } catch {
            return null;
        }
    }
    return null;
}
