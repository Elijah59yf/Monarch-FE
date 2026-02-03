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

/* --- Blog Posts --- */
const blogContainer = document.querySelector('#blog-container');

if (blogContainer) {
    fetchBlogPosts();
}

async function fetchBlogPosts() {
    const STRAPI_BASE_URL = getStrapiBaseUrl();
    const STRAPI_URL = `${STRAPI_BASE_URL}/api/blog-posts?populate=featured_image&sort=publishedAt:desc`;
    
    try {
        const response = await fetch(STRAPI_URL);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        
        const json = await response.json();
        if (!json.data || !Array.isArray(json.data)) throw new Error('Invalid response');
        
        const posts = json.data;
        blogContainer.innerHTML = '';
        blogContainer.classList.add('blog-list');
        
        if (posts.length === 0) {
            blogContainer.innerHTML = '<p class="loading-message">No posts yet. Check back soon.</p>';
            return;
        }
        
        posts.forEach((post, index) => {
            const data = post.attributes || post;
            if (!data || !data.slug || !data.title) return;
            
            const dateToUse = data.publishedAt || data.createdAt;
            const postDate = new Date(dateToUse).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
            
            let imageUrl = '';
            if (data.featured_image?.data?.attributes?.url) {
                imageUrl = STRAPI_BASE_URL + data.featured_image.data.attributes.url;
            } else if (data.featured_image?.url) {
                imageUrl = data.featured_image.url.startsWith('/') 
                    ? STRAPI_BASE_URL + data.featured_image.url 
                    : data.featured_image.url;
            }
            
            const postElement = document.createElement('article');
            postElement.className = 'blog-post-preview fade-in';
            postElement.style.transitionDelay = `${index * 0.1}s`;
            
            const postLink = `blog-post.html?slug=${data.slug}`;
            
            postElement.innerHTML = `
                ${imageUrl ? `<a href="${postLink}"><img src="${imageUrl}" alt="${data.title}" loading="lazy"></a>` : '<div></div>'}
                <div class="post-info">
                    <div class="post-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${postDate}</span>
                    </div>
                    <h2><a href="${postLink}">${data.title}</a></h2>
                    ${data.excerpt ? `<p>${data.excerpt}</p>` : ''}
                    <a href="${postLink}" class="btn">Read Article <i class="fas fa-arrow-right"></i></a>
                </div>
            `;
            
            blogContainer.appendChild(postElement);
            setTimeout(() => postElement.classList.add('visible'), 50);
        });
        
    } catch (error) {
        console.error('Blog fetch error:', error);
        blogContainer.innerHTML = '<p class="loading-message">Unable to load posts.</p>';
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
        const postDate = new Date(dateToUse).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        
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
        
        postDiv.innerHTML = `
            <div class="post-full-header">
                <h1>${post.title || 'Untitled'}</h1>
                <div class="post-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${postDate}</span>
                    <span><i class="fas fa-user"></i> Akinseloyin Elijah</span>
                </div>
            </div>
            ${imageUrl ? `<div class="post-full-image"><img src="${imageUrl}" alt="${post.title || ''}"></div>` : ''}
            <div class="post-full-body">${contentHtml}</div>
            <a href="blog.html" class="btn" style="margin-top: 3rem;"><i class="fas fa-arrow-left"></i> Back to Journal</a>
        `;
        
        postContainer.appendChild(postDiv);
        document.title = `${post.title || 'Blog Post'} | Monarch`;
        
        setTimeout(() => postDiv.classList.add('visible'), 50);
        
    } catch (error) {
        console.error('Post fetch error:', error);
        postContainer.innerHTML = `<p class="loading-message">Error: ${error.message}</p>`;
    }
}

/* --- Projects --- */
const projectContainer = document.querySelector('#project-container');

if (projectContainer) {
    fetchProjects();
}

async function fetchProjects() {
    const STRAPI_BASE_URL = getStrapiBaseUrl();
    const STRAPI_URL = `${STRAPI_BASE_URL}/api/projects?populate=main_image&sort=createdAt:desc`;
    
    try {
        const response = await fetch(STRAPI_URL);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        
        const json = await response.json();
        if (!json.data || !Array.isArray(json.data)) throw new Error('Invalid response');
        
        const projects = json.data;
        projectContainer.innerHTML = '';
        projectContainer.classList.add('projects-grid');
        
        if (projects.length === 0) {
            projectContainer.innerHTML = '<p class="loading-message">Projects coming soon.</p>';
            return;
        }
        
        projects.forEach((project, index) => {
            const data = project.attributes || project;
            if (!data || !data.title) return;
            
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
            
            projectElement.innerHTML = `
                <div class="project-image">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${data.title}" loading="lazy">` : '<i class="fas fa-folder-open"></i>'}
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
            
            projectContainer.appendChild(projectElement);
            setTimeout(() => projectElement.classList.add('visible'), 50);
        });
        
    } catch (error) {
        console.error('Projects fetch error:', error);
        projectContainer.innerHTML = '<p class="loading-message">Unable to load projects.</p>';
    }
}
