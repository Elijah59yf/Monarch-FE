/* ============================================
   J A P A N D I
   Subtle interactions & mindful motion
   Pages are rendered on the server; this file only adds browser behaviour.
   ============================================ */

/* --- Icons (SVG sprite) --- */
const ICON_SPRITE = '/assets/icons/monarch-icons.svg';

function icon(name) {
    return `<svg class="icon icon-${name}" aria-hidden="true"><use href="${ICON_SPRITE}#i-${name}"/></svg>`;
}

/* --- Strings rendered by the server for text built here --- */
const STRINGS = (() => {
    try {
        return JSON.parse(document.getElementById('i18n')?.textContent || '{}');
    } catch {
        return {};
    }
})();
const pluralRules = new Intl.PluralRules(document.documentElement.lang || 'en');

function str(key, n) {
    if (n === undefined) return STRINGS[key] ?? '';
    const exact = `${key}.${pluralRules.select(n)}`;
    const template = STRINGS[exact] ?? STRINGS[`${key}.other`] ?? '';
    return template.replace('{n}', n);
}

function storage(kind) {
    try {
        return window[kind];
    } catch {
        return null;
    }
}
const local = storage('localStorage');
const session = storage('sessionStorage');

/* --- Theme Toggle (Dark Mode) --- */
// The initial theme is set by an inline script in <head> before first paint.
const themeToggle = document.querySelector('.theme-toggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    local?.setItem('theme', newTheme);
}

themeToggle?.addEventListener('click', toggleTheme);

prefersDark.addEventListener('change', (e) => {
    if (!local?.getItem('theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
});

/* --- Language Menu --- */
// Links go to the same page in another language; the cookie remembers the
// choice for visits to "/".
const LANGS = ['en', 'ja', 'de'];
const langToggle = document.querySelector('#lang-toggle');
const langDropdown = document.querySelector('#lang-dropdown');

function saveLanguage(lang) {
    if (!LANGS.includes(lang)) return;
    document.cookie = `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
}

// One-time move of the old localStorage preference into the cookie.
if (!/(?:^|;\s*)lang=/.test(document.cookie)) {
    const saved = local?.getItem('lang');
    if (saved) saveLanguage(saved);
}

if (langToggle && langDropdown) {
    langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!langDropdown.contains(e.target) && !langToggle.contains(e.target)) {
            langDropdown.classList.remove('open');
        }
    });

    langDropdown.querySelectorAll('.lang-option').forEach((option) => {
        option.addEventListener('click', () => saveLanguage(option.dataset.lang));
    });
}

/* --- Mobile Navigation --- */
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('toggle');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('toggle');
            document.body.style.overflow = '';
        });
    });
}

/* --- Scroll Fade Animations --- */
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
});

document.querySelectorAll('.fade-in, .fade-in-stagger').forEach((el) => fadeObserver.observe(el));

/* --- Back to Top --- */
const toTopButton = document.querySelector('#back-to-top');

if (toTopButton) {
    window.addEventListener('scroll', () => {
        toTopButton.classList.toggle('show', window.scrollY > 400);
    });

    toTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* --- Smooth Section Reveals --- */
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.05 });

document.querySelectorAll('section:not(.hero):not(.page-header)').forEach((section) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
    sectionObserver.observe(section);
});

/* --- Image Blur-Up Lazy Loading --- */
function markLoaded(img) {
    img.classList.remove('lazy');
    img.classList.add('loaded');
    img.closest('.blur-up-container')?.classList.add('loaded');
}

const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (img.complete) markLoaded(img);
        else img.addEventListener('load', () => markLoaded(img), { once: true });
        imageObserver.unobserve(img);
    });
}, { rootMargin: '50px' });

document.querySelectorAll('.blur-up-container img.lazy').forEach((img) => imageObserver.observe(img));

/* --- Animated Skill Bars --- */
function animateSkillPercent(item, targetValue) {
    const percentEl = item.querySelector('.skill-percent');
    if (!percentEl) return;

    let current = 0;
    const steps = 60;
    const increment = targetValue / steps;
    const stepTime = 1200 / steps;

    const counter = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            current = targetValue;
            clearInterval(counter);
        }
        percentEl.textContent = `${Math.round(current)}%`;
    }, stepTime);
}

const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (!entry.isIntersecting) return;
        const item = entry.target;
        const skillLevel = Number(item.dataset.skill) || 0;
        setTimeout(() => {
            item.style.setProperty('--skill-level', `${skillLevel}%`);
            item.classList.add('animate');
            animateSkillPercent(item, skillLevel);
        }, index * 150);
        skillObserver.unobserve(item);
    });
}, { threshold: 0.3, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.skill-bar-item').forEach((bar) => skillObserver.observe(bar));

/* --- View Counter (per browser) --- */
function readJson(store, key, fallback) {
    try {
        return JSON.parse(store?.getItem(key) || '') ?? fallback;
    } catch {
        return fallback;
    }
}

function getViewCount(slug) {
    return readJson(local, 'monarchViewCounts', {})[slug] || 0;
}

function incrementViewCount(slug) {
    const views = readJson(local, 'monarchViewCounts', {});
    const sessionViewed = readJson(session, 'monarchViewedPosts', []);

    // Only count once per session per post
    if (!sessionViewed.includes(slug)) {
        views[slug] = (views[slug] || 0) + 1;
        sessionViewed.push(slug);
        try {
            local?.setItem('monarchViewCounts', JSON.stringify(views));
            session?.setItem('monarchViewedPosts', JSON.stringify(sessionViewed));
        } catch {
            // storage full or blocked
        }
    }
    return views[slug] || 1;
}

document.querySelectorAll('.view-count[data-view-slug]').forEach((el) => {
    el.innerHTML = `${icon('eye')} ${str('blog.viewCount', getViewCount(el.dataset.viewSlug))}`;
});

const postContainer = document.querySelector('[data-post-slug]');
const postMeta = postContainer?.querySelector('.post-meta');
if (postMeta) {
    const viewCount = incrementViewCount(postContainer.dataset.postSlug);
    const viewSpan = document.createElement('span');
    viewSpan.className = 'view-count just-viewed';
    viewSpan.innerHTML = `${icon('eye')} ${str('blog.viewCount', viewCount)}`;
    postMeta.appendChild(viewSpan);
    setTimeout(() => viewSpan.classList.remove('just-viewed'), 300);
}

/* --- Journal Search --- */
function filterBlogPosts(query) {
    const resultsCount = document.querySelector('#search-results-count');
    let visibleCount = 0;

    document.querySelectorAll('.blog-post-preview').forEach((post) => {
        const title = post.querySelector('h2')?.textContent.toLowerCase() || '';
        const excerpt = post.querySelector('.post-info p')?.textContent.toLowerCase() || '';
        const matches = query === '' || title.includes(query) || excerpt.includes(query);
        post.classList.toggle('hidden', !matches);
        if (matches) visibleCount++;
    });

    if (resultsCount) {
        if (query === '') resultsCount.textContent = '';
        else if (visibleCount === 0) resultsCount.textContent = str('blog.noResults');
        else resultsCount.textContent = str('blog.results', visibleCount);
    }
}

(function initBlogSearch() {
    const searchToggle = document.querySelector('#search-toggle');
    const searchBox = document.querySelector('.search-box');
    const searchInput = document.querySelector('#blog-search');
    const clearButton = document.querySelector('#search-clear');

    if (!searchToggle || !searchBox || !searchInput) return;

    function collapse() {
        searchBox.classList.remove('expanded');
        searchToggle.classList.remove('active');
        searchInput.value = '';
        clearButton?.classList.remove('visible');
        filterBlogPosts('');
    }

    searchToggle.addEventListener('click', () => {
        if (searchBox.classList.contains('expanded')) {
            collapse();
        } else {
            searchBox.classList.add('expanded');
            searchToggle.classList.add('active');
            setTimeout(() => searchInput.focus(), 300);
        }
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        clearButton?.classList.toggle('visible', query.length > 0);
        filterBlogPosts(query);
    });

    clearButton?.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.classList.remove('visible');
        filterBlogPosts('');
        searchInput.focus();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') collapse();
    });
})();

/* --- Project Filters --- */
function filterProjects(category) {
    let visibleCount = 0;

    document.querySelectorAll('.project-card').forEach((project) => {
        const tags = project.dataset.tags || '';
        const matches = category === 'all' || tags.toLowerCase().includes(category.toLowerCase());
        project.classList.toggle('hidden', !matches);
        if (matches) visibleCount++;
    });

    const gridWrapper = document.querySelector('#projects-grid-wrapper');
    const existingMessage = gridWrapper?.querySelector('.no-projects-message');

    if (visibleCount === 0 && gridWrapper) {
        if (!existingMessage) {
            const message = document.createElement('p');
            message.className = 'no-projects-message';
            message.textContent = str('projects.emptyFilter');
            gridWrapper.appendChild(message);
        }
    } else {
        existingMessage?.remove();
    }
}

document.querySelector('#project-filters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    e.currentTarget.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    filterProjects(btn.dataset.filter);
});

/* --- Project image fallback --- */
document.querySelectorAll('.project-image img').forEach((img) => {
    const fallback = () => {
        const card = img.closest('.project-card');
        const imageBox = img.closest('.project-image');
        if (imageBox) imageBox.innerHTML = icon('folder');
        card?.classList.remove('featured');
    };
    if (img.complete && img.naturalWidth === 0) fallback();
    else img.addEventListener('error', fallback, { once: true });
});
