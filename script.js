/* ============================================
   J A P A N D I
   Subtle interactions & mindful motion
   ============================================ */

/* --- Theme Toggle (Dark Mode) --- */
const themeToggle = document.querySelector('.theme-toggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

// Initialize theme from localStorage or system preference
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Initialize on load
initTheme();

if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Listen for system preference changes
prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
});

/* --- Language Toggle (i18n) --- */
const langToggle = document.querySelector('#lang-toggle');
const langDropdown = document.querySelector('#lang-dropdown');
const currentLangDisplay = document.querySelector('#current-lang');

// Get saved language or default to English
function getCurrentLang() {
    return localStorage.getItem('lang') || 'en';
}

// Set language and update UI
function setLanguage(lang) {
    if (!window.translations || !window.translations[lang]) {
        console.warn('Translations not available for:', lang);
        return;
    }
    
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);
    
    // Update current language display
    if (currentLangDisplay) {
        currentLangDisplay.textContent = lang.toUpperCase();
    }
    
    // Update active state in dropdown
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === lang);
    });
    
    // Translate all elements with data-i18n attribute
    translatePage(lang);
}

// Translate page elements
function translatePage(lang) {
    const t = window.translations?.[lang];
    if (!t) return;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            // Check if it contains HTML (like <strong>)
            if (t[key].includes('<')) {
                el.innerHTML = t[key];
            } else {
                el.textContent = t[key];
            }
        }
    });
    
    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });
}

// Get a single translation string
function t(key, fallback = '') {
    const lang = getCurrentLang();
    const translations = window.translations?.[lang];
    return translations?.[key] || fallback || key;
}

// Get localized date string
function getLocalizedDate(dateString) {
    const lang = getCurrentLang();
    const localeMap = { en: 'en-US', ja: 'ja-JP', de: 'de-DE' };
    const locale = localeMap[lang] || 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

// Initialize language
function initLanguage() {
    const lang = getCurrentLang();
    setLanguage(lang);
}

// Toggle dropdown
if (langToggle && langDropdown) {
    langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!langDropdown.contains(e.target) && !langToggle.contains(e.target)) {
            langDropdown.classList.remove('open');
        }
    });
    
    // Handle language selection
    langDropdown.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.dataset.lang;
            setLanguage(lang);
            langDropdown.classList.remove('open');
        });
    });
}

// Initialize on load (wait for translations to load)
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure translations.js is loaded
    setTimeout(initLanguage, 50);
});

/* --- Mobile Navigation --- */
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('toggle');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('toggle');
            document.body.style.overflow = '';
        });
    });
}

/* --- Scroll Fade Animations --- */
const fadeElements = document.querySelectorAll('.fade-in, .fade-in-stagger');

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, { 
    threshold: 0.1, 
    rootMargin: '0px 0px -50px 0px' 
});

fadeElements.forEach(el => fadeObserver.observe(el));

/* --- Testimonials Slider --- */
const testimonialsTrack = document.querySelector('#testimonials-track');
const testimonialPrev = document.querySelector('#testimonial-prev');
const testimonialNext = document.querySelector('#testimonial-next');
const testimonialsDots = document.querySelector('#testimonials-dots');

if (testimonialsTrack) {
    const cards = testimonialsTrack.querySelectorAll('.testimonial-card');
    let currentIndex = 0;
    const totalCards = cards.length;
    
    // Create dots
    cards.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = `testimonial-dot${index === 0 ? ' active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        testimonialsDots.appendChild(dot);
    });
    
    const dots = testimonialsDots.querySelectorAll('.testimonial-dot');
    
    function updateSlider() {
        testimonialsTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }
    
    function goToSlide(index) {
        currentIndex = index;
        updateSlider();
    }
    
    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalCards;
        updateSlider();
    }
    
    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalCards) % totalCards;
        updateSlider();
    }
    
    testimonialNext?.addEventListener('click', nextSlide);
    testimonialPrev?.addEventListener('click', prevSlide);
    
    // Auto-advance every 6 seconds
    let autoSlide = setInterval(nextSlide, 6000);
    
    // Pause on hover
    testimonialsTrack.addEventListener('mouseenter', () => clearInterval(autoSlide));
    testimonialsTrack.addEventListener('mouseleave', () => {
        autoSlide = setInterval(nextSlide, 6000);
    });
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    testimonialsTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    testimonialsTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextSlide();
            else prevSlide();
        }
    }, { passive: true });
}

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
const sections = document.querySelectorAll('section:not(.hero):not(.page-header)');

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.05 });

sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)';
    sectionObserver.observe(section);
});

/* --- Image Blur-Up Lazy Loading --- */
function createBlurUpImage(src, alt) {
    // Returns HTML for a blur-up image container
    if (!src) return '';
    return `
        <div class="blur-up-container">
            <img src="${src}" alt="${alt || ''}" class="lazy" loading="lazy">
        </div>
    `;
}

function initBlurUpImages() {
    const lazyImages = document.querySelectorAll('.blur-up-container img.lazy');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                
                // When image loads, remove blur
                if (img.complete) {
                    img.classList.remove('lazy');
                    img.classList.add('loaded');
                    img.closest('.blur-up-container')?.classList.add('loaded');
                } else {
                    img.addEventListener('load', () => {
                        img.classList.remove('lazy');
                        img.classList.add('loaded');
                        img.closest('.blur-up-container')?.classList.add('loaded');
                    }, { once: true });
                }
                
                imageObserver.unobserve(img);
            }
        });
    }, { rootMargin: '50px' });
    
    lazyImages.forEach(img => imageObserver.observe(img));
}

// Initialize on page load and after dynamic content loads
document.addEventListener('DOMContentLoaded', initBlurUpImages);

/* --- Helper: Calculate Reading Time --- */
function calculateReadingTime(content) {
    if (!content) return 1;
    
    let text = '';
    
    // Handle Strapi block content (array of blocks)
    if (Array.isArray(content)) {
        content.forEach(block => {
            if (block.children && Array.isArray(block.children)) {
                block.children.forEach(child => {
                    if (child.text) text += child.text + ' ';
                });
            }
        });
    } else if (typeof content === 'string') {
        // Handle plain string content
        text = content.replace(/<[^>]*>/g, ''); // Strip HTML tags
    }
    
    // Average reading speed: 200 words per minute
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const minutes = Math.ceil(words / 200);
    
    return Math.max(1, minutes); // Minimum 1 minute
}

/* --- Helper: Strapi Content to HTML --- */
function convertStrapiContentToHtml(content) {
    if (!Array.isArray(content)) {
        console.error('Invalid content format:', content);
        return '<p>Content format error.</p>';
    }
    
    let html = '';
    const strapiBaseUrl = getStrapiBaseUrl();

    function renderChildren(children) {
        let childHtml = '';
        if (!Array.isArray(children)) return '';

        children.forEach(child => {
            if (child.type === 'text') {
                let text = child.text || '';
                if (child.bold) text = `<strong>${text}</strong>`;
                if (child.italic) text = `<em>${text}</em>`;
                if (child.code) text = `<code>${text}</code>`;
                text = text.replace(/\n/g, '<br>');
                childHtml += text;
            } else if (child.type === 'link' && child.url) {
                let linkText = Array.isArray(child.children) ? renderChildren(child.children) : child.url;
                childHtml += `<a href="${child.url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
            }
        });
        return childHtml;
    }

    content.forEach(block => {
        if (block.type === 'paragraph') {
            html += `<p>${renderChildren(block.children)}</p>`;
        } else if (block.type === 'heading') {
            const level = block.level || 2;
            html += `<h${level}>${renderChildren(block.children)}</h${level}>`;
        } else if (block.type === 'list') {
            const listType = block.format === 'ordered' ? 'ol' : 'ul';
            html += `<${listType}>`;
            if (Array.isArray(block.children)) {
                block.children.forEach(listItem => {
                    if (listItem.type === 'list-item' && Array.isArray(listItem.children)) {
                        html += `<li>${renderChildren(listItem.children)}</li>`;
                    }
                });
            }
            html += `</${listType}>`;
        } else if (block.type === 'image' && block.image?.url) {
            const altText = block.image.alternativeText || '';
            const imgUrl = block.image.url.startsWith('/') ? strapiBaseUrl + block.image.url : block.image.url;
            html += `<figure><img src="${imgUrl}" alt="${altText}"></figure>`;
        } else if (block.type === 'code') {
            html += `<pre><code>${block.children?.map(c => c.text).join('') || ''}</code></pre>`;
        }
    });
    
    return html;
}

/* --- Dynamic Backend URL --- */
function getStrapiBaseUrl() { 
    return 'https://api.monarchdem.me'; 
}

function getMailServerUrl() { 
    return isLocal ? 'http://localhost:3000' : 'https://mail.monarchdem.me'; 
}

/* --- Contact Form --- */
const contactForm = document.querySelector('#contact-form');

if (contactForm) {
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : 'Send Message';
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (submitButton) {
            submitButton.innerHTML = 'Sending...';
            submitButton.disabled = true;
        }
        
        const formData = {
            name: contactForm.querySelector('#name').value,
            email: contactForm.querySelector('#email').value,
            message: contactForm.querySelector('#message').value
        };
        
        try {
            const response = await fetch(`${getMailServerUrl()}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) throw new Error('Network error');
            
            contactForm.reset();
            if (submitButton) submitButton.innerHTML = 'Message Sent ✓';
            
        } catch (error) {
            console.error('Contact form error:', error);
            if (submitButton) submitButton.innerHTML = 'Error. Try Again.';
        } finally {
            setTimeout(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                }
            }, 3000);
        }
    });
}

/* --- Animated Skill Bars --- */
function initSkillBars() {
    const skillBars = document.querySelectorAll('.skill-bar-item');
    if (!skillBars.length) return;
    
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                const item = entry.target;
                const skillLevel = item.dataset.skill || 0;
                
                // Stagger the animation
                setTimeout(() => {
                    item.style.setProperty('--skill-level', `${skillLevel}%`);
                    item.classList.add('animate');
                    
                    // Animate the percentage counter
                    animateSkillPercent(item, skillLevel);
                }, index * 150);
                
                skillObserver.unobserve(item);
            }
        });
    }, observerOptions);
    
    skillBars.forEach(bar => skillObserver.observe(bar));
}

function animateSkillPercent(item, targetValue) {
    const percentEl = item.querySelector('.skill-percent');
    if (!percentEl) return;
    
    let current = 0;
    const duration = 1200;
    const steps = 60;
    const increment = targetValue / steps;
    const stepTime = duration / steps;
    
    const counter = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            current = targetValue;
            clearInterval(counter);
        }
        percentEl.textContent = `${Math.round(current)}%`;
    }, stepTime);
}

// Initialize skill bars on page load
document.addEventListener('DOMContentLoaded', initSkillBars);

/* --- Skeleton Loaders --- */
function createBlogSkeletons(count = 3) {
    let html = '<div class="skeleton-blog-grid">';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-blog-post">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton-blog-content">
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-button"></div>
                </div>
            </div>
        `;
    }
    html += '</div>';
    return html;
}

function createProjectSkeletons(count = 4) {
    let html = '<div class="skeleton-projects-grid">';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text medium"></div>
                <div class="skeleton skeleton-button"></div>
            </div>
        `;
    }
    html += '</div>';
    return html;
}

/* --- View Counter --- */
function getViewCount(slug) {
    const views = JSON.parse(localStorage.getItem('monarchViewCounts') || '{}');
    return views[slug] || 0;
}

function incrementViewCount(slug) {
    const views = JSON.parse(localStorage.getItem('monarchViewCounts') || '{}');
    const sessionViewed = JSON.parse(sessionStorage.getItem('monarchViewedPosts') || '[]');
    
    // Only increment once per session per post
    if (!sessionViewed.includes(slug)) {
        views[slug] = (views[slug] || 0) + 1;
        localStorage.setItem('monarchViewCounts', JSON.stringify(views));
        
        sessionViewed.push(slug);
        sessionStorage.setItem('monarchViewedPosts', JSON.stringify(sessionViewed));
    }
    
    return views[slug] || 1;
}

function addViewCountToPost(postDiv, viewCount) {
    const metaDiv = postDiv.querySelector('.post-meta');
    if (!metaDiv) return;
    
    const viewSpan = document.createElement('span');
    viewSpan.className = 'view-count just-viewed';
    viewSpan.innerHTML = `<i class="fas fa-eye"></i> ${viewCount} view${viewCount !== 1 ? 's' : ''}`;
    metaDiv.appendChild(viewSpan);
    
    // Remove animation class after it plays
    setTimeout(() => viewSpan.classList.remove('just-viewed'), 300);
}

/* --- Blog Posts --- */
const blogContainer = document.querySelector('#blog-container');

if (blogContainer) {
    // Keep search box, add skeletons after it
    const searchBox = blogContainer.querySelector('.search-box');
    const resultsCount = blogContainer.querySelector('.search-results-count');
    
    // Create a container for posts
    const postsWrapper = document.createElement('div');
    postsWrapper.id = 'blog-posts-wrapper';
    postsWrapper.innerHTML = createBlogSkeletons(3);
    blogContainer.appendChild(postsWrapper);
    
    fetchBlogPosts();
    initBlogSearch();
}

// Blog search functionality
function initBlogSearch() {
    const searchToggle = document.querySelector('#search-toggle');
    const searchBox = document.querySelector('.search-box');
    const searchInput = document.querySelector('#blog-search');
    const clearButton = document.querySelector('#search-clear');
    
    if (!searchToggle || !searchBox || !searchInput) return;
    
    // Toggle search box
    searchToggle.addEventListener('click', () => {
        const isExpanded = searchBox.classList.contains('expanded');
        
        if (isExpanded) {
            // Collapse
            searchBox.classList.remove('expanded');
            searchToggle.classList.remove('active');
            searchInput.value = '';
            clearButton?.classList.remove('visible');
            filterBlogPosts('');
        } else {
            // Expand
            searchBox.classList.add('expanded');
            searchToggle.classList.add('active');
            setTimeout(() => searchInput.focus(), 300);
        }
    });
    
    // Filter on input
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (clearButton) {
            clearButton.classList.toggle('visible', query.length > 0);
        }
        
        filterBlogPosts(query);
    });
    
    // Clear button
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            clearButton.classList.remove('visible');
            filterBlogPosts('');
            searchInput.focus();
        });
    }
    
    // Close on Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchBox.classList.remove('expanded');
            searchToggle.classList.remove('active');
            searchInput.value = '';
            clearButton?.classList.remove('visible');
            filterBlogPosts('');
        }
    });
}

function filterBlogPosts(query) {
    const posts = document.querySelectorAll('.blog-post-preview');
    const resultsCount = document.querySelector('#search-results-count');
    let visibleCount = 0;
    
    posts.forEach(post => {
        const title = post.querySelector('h2')?.textContent.toLowerCase() || '';
        const excerpt = post.querySelector('.post-info p')?.textContent.toLowerCase() || '';
        
        const matches = query === '' || title.includes(query) || excerpt.includes(query);
        
        post.classList.toggle('hidden', !matches);
        if (matches) visibleCount++;
    });
    
    // Update results count
    if (resultsCount) {
        if (query === '') {
            resultsCount.textContent = '';
        } else if (visibleCount === 0) {
            resultsCount.textContent = 'No articles found';
        } else {
            resultsCount.textContent = `${visibleCount} article${visibleCount !== 1 ? 's' : ''} found`;
        }
    }
}

async function fetchBlogPosts() {
    const STRAPI_BASE_URL = getStrapiBaseUrl();
    const STRAPI_URL = `${STRAPI_BASE_URL}/api/blog-posts?populate=featured_image&sort=publishedAt:desc`;
    const postsWrapper = document.querySelector('#blog-posts-wrapper');
    
    if (!postsWrapper) return;
    
    try {
        const response = await fetch(STRAPI_URL);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        
        const json = await response.json();
        if (!json.data || !Array.isArray(json.data)) throw new Error('Invalid response');
        
        const posts = json.data;
        postsWrapper.innerHTML = '';
        postsWrapper.classList.add('blog-list');
        
        if (posts.length === 0) {
            postsWrapper.innerHTML = '<p class="loading-message">No posts yet. Check back soon.</p>';
            return;
        }
        
        posts.forEach((post, index) => {
            const data = post.attributes || post;
            if (!data || !data.slug || !data.title) return;
            
            const dateToUse = data.publishedAt || data.createdAt;
            
            let imageUrl = '';
            if (data.featured_image?.data?.attributes?.url) {
                imageUrl = STRAPI_BASE_URL + data.featured_image.data.attributes.url;
            } else if (data.featured_image?.url) {
                imageUrl = data.featured_image.url.startsWith('/') 
                    ? STRAPI_BASE_URL + data.featured_image.url 
                    : data.featured_image.url;
            }
            
            const readingTime = calculateReadingTime(data.content);
            const viewCount = getViewCount(data.slug);
            
            // Get localized date
            const postDate = getLocalizedDate(dateToUse);
            
            const postElement = document.createElement('article');
            postElement.className = 'blog-post-preview fade-in';
            postElement.style.transitionDelay = `${index * 0.1}s`;
            
            const postLink = `blog-post.html?slug=${data.slug}`;
            
            // Get translations
            const minReadText = t('blog.minRead', 'min read');
            const viewsText = t('blog.views', 'views');
            const readArticleText = t('blog.readArticle', 'Read Article');
            
            postElement.innerHTML = `
                ${imageUrl ? `<a href="${postLink}">${createBlurUpImage(imageUrl, data.title)}</a>` : '<div></div>'}
                <div class="post-info">
                    <div class="post-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${postDate}</span>
                        <span class="reading-time"><i class="fas fa-clock"></i> ${readingTime} ${minReadText}</span>
                        <span class="view-count"><i class="fas fa-eye"></i> ${viewCount} ${viewsText}</span>
                    </div>
                    <h2><a href="${postLink}">${data.title}</a></h2>
                    ${data.excerpt ? `<p>${data.excerpt}</p>` : ''}
                    <a href="${postLink}" class="btn">${readArticleText} <i class="fas fa-arrow-right"></i></a>
                </div>
            `;
            
            postsWrapper.appendChild(postElement);
            setTimeout(() => {
                postElement.classList.add('visible');
                initBlurUpImages();
            }, 50);
        });
        
    } catch (error) {
        console.error('Blog fetch error:', error);
        postsWrapper.innerHTML = '<p class="loading-message">Unable to load posts.</p>';
    }
}

/* --- Single Blog Post --- */
const postContainer = document.querySelector('#post-content-wrapper');

if (postContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const postSlug = urlParams.get('slug');
    
    if (postSlug) {
        fetchSinglePost(postSlug);
    } else {
        postContainer.innerHTML = '<p class="loading-message">No post specified.</p>';
    }
}

async function fetchSinglePost(slug) {
    const STRAPI_BASE_URL = getStrapiBaseUrl();
    const STRAPI_URL = `${STRAPI_BASE_URL}/api/blog-posts?filters[slug][$eq]=${slug}&populate=featured_image`;
    
    try {
        const response = await fetch(STRAPI_URL);
        if (!response.ok) throw new Error('Network error');
        
        const json = await response.json();
        if (json.data.length === 0) throw new Error('Post not found.');
        
        const postData = json.data[0];
        const post = postData.attributes || postData;
        
        const dateToUse = post.publishedAt || post.createdAt;
        
        let imageUrl = '';
        if (post.featured_image?.data?.attributes?.url) {
            imageUrl = STRAPI_BASE_URL + post.featured_image.data.attributes.url;
        } else if (post.featured_image?.url) {
            imageUrl = post.featured_image.url.startsWith('/') 
                ? STRAPI_BASE_URL + post.featured_image.url 
                : post.featured_image.url;
        }
        
        postContainer.innerHTML = '';
        
        const postDiv = document.createElement('div');
        postDiv.className = 'container container-narrow fade-in';
        
        const contentHtml = convertStrapiContentToHtml(post.content);
        
        const readingTime = calculateReadingTime(post.content);
        
        // Get localized date
        const postDate = getLocalizedDate(dateToUse);
        
        // Get translations
        const minReadText = t('blog.minRead', 'min read');
        const backText = t('blog.backToJournal', 'Back to Journal');
        
        postDiv.innerHTML = `
            <div class="post-full-header">
                <h1>${post.title || 'Untitled'}</h1>
                <div class="post-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${postDate}</span>
                    <span><i class="fas fa-user"></i> Akinseloyin Elijah</span>
                    <span class="reading-time"><i class="fas fa-clock"></i> ${readingTime} ${minReadText}</span>
                </div>
            </div>
            ${imageUrl ? `<div class="post-full-image">${createBlurUpImage(imageUrl, post.title || '')}</div>` : ''}
            <div class="post-full-body">${contentHtml}</div>
            <a href="blog.html" class="btn" style="margin-top: 3rem;"><i class="fas fa-arrow-left"></i> ${backText}</a>
        `;
        
        postContainer.appendChild(postDiv);
        document.title = `${post.title || 'Blog Post'} | Monarch`;
        
        // Track and display view count
        const viewCount = incrementViewCount(slug);
        addViewCountToPost(postDiv, viewCount);
        
        setTimeout(() => {
            postDiv.classList.add('visible');
            initBlurUpImages();
        }, 50);
        
    } catch (error) {
        console.error('Post fetch error:', error);
        postContainer.innerHTML = `<p class="loading-message">Error: ${error.message}</p>`;
    }
}

/* --- Projects --- */
const projectContainer = document.querySelector('#project-container');

if (projectContainer) {
    const gridWrapper = document.querySelector('#projects-grid-wrapper');
    if (gridWrapper) {
        gridWrapper.innerHTML = createProjectSkeletons(4);
    }
    fetchProjects();
}

let allProjectCategories = new Set(['all']);

function initProjectFilters() {
    const filtersContainer = document.querySelector('#project-filters');
    const filterBtns = filtersContainer?.querySelectorAll('.filter-btn');
    
    if (!filtersContainer) return;
    
    filtersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        
        // Update active state
        filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        filterProjects(filter);
    });
}

function filterProjects(category) {
    const projects = document.querySelectorAll('.project-card');
    let visibleCount = 0;
    
    projects.forEach(project => {
        const tags = project.dataset.tags || '';
        const matches = category === 'all' || tags.toLowerCase().includes(category.toLowerCase());
        
        project.classList.toggle('hidden', !matches);
        if (matches) visibleCount++;
    });
    
    // Show message if no projects match
    const gridWrapper = document.querySelector('#projects-grid-wrapper');
    const existingMessage = gridWrapper?.querySelector('.no-projects-message');
    
    if (visibleCount === 0 && gridWrapper) {
        if (!existingMessage) {
            const message = document.createElement('p');
            message.className = 'no-projects-message';
            message.textContent = 'No projects in this category yet.';
            gridWrapper.appendChild(message);
        }
    } else if (existingMessage) {
        existingMessage.remove();
    }
}

async function fetchProjects() {
    const STRAPI_BASE_URL = getStrapiBaseUrl();
    const STRAPI_URL = `${STRAPI_BASE_URL}/api/projects?populate=main_image&sort=createdAt:desc`;
    const gridWrapper = document.querySelector('#projects-grid-wrapper');
    const filtersContainer = document.querySelector('#project-filters');
    
    if (!gridWrapper) return;
    
    try {
        const response = await fetch(STRAPI_URL);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        
        const json = await response.json();
        if (!json.data || !Array.isArray(json.data)) throw new Error('Invalid response');
        
        const projects = json.data;
        gridWrapper.innerHTML = '';
        gridWrapper.classList.add('projects-grid');
        
        if (projects.length === 0) {
            gridWrapper.innerHTML = '<p class="loading-message">Projects coming soon.</p>';
            return;
        }
        
        // Collect all unique tags for filter buttons
        const allTags = new Set();
        
        projects.forEach((project, index) => {
            const data = project.attributes || project;
            if (!data || !data.title) return;
            
            // Collect tags
            if (data.tags) {
                data.tags.split(',').forEach(tag => allTags.add(tag.trim()));
            }
            
            let imageUrl = '';
            if (data.main_image?.data?.attributes?.url) {
                imageUrl = STRAPI_BASE_URL + data.main_image.data.attributes.url;
            } else if (data.main_image?.url) {
                imageUrl = data.main_image.url.startsWith('/') 
                    ? STRAPI_BASE_URL + data.main_image.url 
                    : data.main_image.url;
            }
            
            const projectElement = document.createElement('div');
            projectElement.className = 'project-card fade-in';
            projectElement.style.transitionDelay = `${index * 0.1}s`;
            projectElement.dataset.tags = data.tags || '';
            
            projectElement.innerHTML = `
                <div class="project-image">
                    ${imageUrl ? createBlurUpImage(imageUrl, data.title) : '<i class="fas fa-folder-open"></i>'}
                </div>
                <div class="project-content">
                    <h3>${data.title}</h3>
                    <p>${data.description || 'A thoughtful technical solution.'}</p>
                    <div class="project-tags">
                        ${data.tags ? data.tags.split(',').map(tag => `<span>${tag.trim()}</span>`).join('') : ''}
                    </div>
                    <a href="${data.link || '#'}" target="_blank" class="btn">
                        View Project <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            `;
            
            gridWrapper.appendChild(projectElement);
            setTimeout(() => {
                projectElement.classList.add('visible');
                initBlurUpImages();
            }, 50);
        });
        
        // Add filter buttons dynamically
        if (filtersContainer && allTags.size > 0) {
            allTags.forEach(tag => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.dataset.filter = tag;
                btn.textContent = tag;
                filtersContainer.appendChild(btn);
            });
        }
        
        initProjectFilters();
        
    } catch (error) {
        console.error('Projects fetch error:', error);
        gridWrapper.innerHTML = '<p class="loading-message">Unable to load projects.</p>';
    }
}
