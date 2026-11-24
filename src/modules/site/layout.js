import { html, raw } from '../../lib/html.js';
import { LANGS, clientStrings, langName, t } from '../i18n/index.js';
import { SOCIAL_LINKS } from '../../data/site.js';
import { icon } from './icons.js';
import { localizedPath } from './paths.js';

const NAV = [
    { id: 'home', path: '/', key: 'nav.home' },
    { id: 'about', path: '/about', key: 'nav.about' },
    { id: 'services', path: '/services', key: 'nav.services' },
    { id: 'projects', path: '/projects', key: 'nav.projects' },
    { id: 'journal', path: '/journal', key: 'nav.journal' },
];

// Strings that script.js builds at runtime. Plural keys expand to .one/.other.
const CLIENT_STRINGS = ['blog.noResults', 'blog.results', 'blog.viewCount', 'projects.emptyFilter'];

// Runs before first paint so a saved dark theme never flashes light.
const THEME_SCRIPT = raw(`<script>try{var t=localStorage.getItem('theme');if(t||matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.setAttribute('data-theme',t||'dark')}catch(e){}</script>`);

const SCRIPT_PATH = '/site.js';

function jsonForScript(value) {
    return raw(JSON.stringify(value).replace(/</g, '\\u003c'));
}

function alternates(site, path) {
    return [
        ...LANGS.map((l) => html`
    <link rel="alternate" hreflang="${l}" href="${site}${localizedPath(l, path)}">`),
        html`
    <link rel="alternate" hreflang="x-default" href="${site}${path}">`,
    ];
}

// page: { title, description, nav, body, indexable }
// ctx:  { lang, path, siteUrl, settings }
export function layout(page, ctx) {
    const { lang, path, siteUrl, settings } = ctx;
    const business = settings['business.name'];
    const email = settings['business.contact_email'];
    const indexable = page.indexable !== false;

    return html`<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title}</title>
    <meta name="description" content="${page.description}">
    ${indexable
        ? html`<link rel="canonical" href="${siteUrl}${localizedPath(lang, path)}">${alternates(siteUrl, path)}`
        : html`<meta name="robots" content="noindex">`}

    <!-- PWA -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#c67b5c">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="${business}">
    <link rel="apple-touch-icon" href="/img/icon-192.png">

    ${THEME_SCRIPT}

    <!-- Styles -->
    <link rel="stylesheet" href="/style.css">
</head>
<body>

    <!-- Header -->
    <header>
        <div class="container">
            <a href="${localizedPath(lang, '/')}" class="logo">${business}</a>
            <nav>
                <div class="hamburger">
                    <div class="line"></div>
                    <div class="line"></div>
                    <div class="line"></div>
                </div>
                <ul class="nav-links">${NAV.map((item) => html`
                    <li><a href="${localizedPath(lang, item.path)}"${item.id === page.nav ? raw(' class="active"') : ''}>${t(lang, item.key)}</a></li>`)}
                </ul>
            </nav>
        </div>
    </header>

    <main>
${page.body}
    </main>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-content">
                <span class="footer-logo">${business}</span>
                <div class="social-icons">${SOCIAL_LINKS.map((link) => html`
                    <a href="${link.href}" target="_blank" aria-label="${link.label}" rel="noopener noreferrer">
                        ${icon(link.icon)}
                    </a>`)}
                    <a href="mailto:${email}" aria-label="${t(lang, 'footer.email')}">
                        ${icon('mail')}
                    </a>
                </div>
                <p>${t(lang, 'footer.copyright')}</p>
            </div>
        </div>
    </footer>

    <!-- Theme Toggle -->
    <button class="theme-toggle" aria-label="${t(lang, 'a11y.themeToggle')}" title="${t(lang, 'a11y.themeTitle')}">
        ${icon('moon')}
        ${icon('sun')}
    </button>

    <!-- Language Toggle -->
    <button class="lang-toggle" id="lang-toggle" aria-label="${t(lang, 'a11y.langToggle')}" title="${t(lang, 'a11y.langToggle')}">
        ${icon('globe')}
        <span class="lang-code" id="current-lang">${lang.toUpperCase()}</span>
    </button>
    <div class="lang-dropdown" id="lang-dropdown">${LANGS.map((l) => html`
        <a class="lang-option${l === lang ? ' active' : ''}" href="${localizedPath(l, path)}" hreflang="${l}" lang="${l}" data-lang="${l}">
            <span>${langName(l)}</span>
        </a>`)}
    </div>

    <!-- Back to Top -->
    <a id="back-to-top" href="#" aria-label="${t(lang, 'a11y.backToTop')}">${icon('arrow-up')}</a>

    <script type="application/json" id="i18n">${jsonForScript(clientStrings(lang, CLIENT_STRINGS))}</script>
    <script src="${SCRIPT_PATH}" defer></script>
</body>
</html>
`;
}
