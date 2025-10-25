/* --- 1. Mobile Navigation (Hamburger Menu) --- */
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('toggle');
});

/* --- 2. Scroll Fade-In Animation --- */
const faders = document.querySelectorAll('.fade-in');
const appearOptions = { threshold: 0.2, rootMargin: "0px 0px -50px 0px" };
const appearOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
    });
}, appearOptions);
faders.forEach(fader => appearOnScroll.observe(fader));

/* --- 3. Back to Top Button --- */
const toTopButton = document.querySelector('#back-to-top');
window.addEventListener('scroll', () => {
    toTopButton.classList.toggle('show', window.scrollY > 300);
});

/* --- Helper Function: Convert Strapi Rich Text to Basic HTML --- */
function convertStrapiContentToHtml(content) {
    if (!Array.isArray(content)) {
        console.error('Invalid content format received by convertStrapiContentToHtml:', content);
        return '<p>Content format error.</p>';
    }
    let html = '';
    const strapiBaseUrl = getStrapiBaseUrl();

    // *** REFINED renderChildren FUNCTION ***
    function renderChildren(children) {
        let childHtml = '';
        if (!Array.isArray(children)) {
             console.error('renderChildren expected an array, got:', children);
             return ''; // Return empty string if input is not an array
        }
        // console.log("--- Rendering children:", children); // Optional: log input

        children.forEach((child, index) => {
            // console.log(`Processing child ${index}:`, child); // Optional: log each child
            if (child.type === 'text') {
                let text = child.text; // Get the text
                if (typeof text !== 'string') {
                    console.warn(`Child ${index} text is not a string:`, text);
                    text = ''; // Use empty string if text is invalid
                }
                // Apply formatting
                if (child.bold) text = `<strong>${text}</strong>`;
                if (child.italic) text = `<em>${text}</em>`;
                // Handle newlines BEFORE adding to html
                text = text.replace(/\n/g, '<br>');
                childHtml += text; // Add the processed text
                // console.log(`  -> Text processed: "${text}", childHtml: "${childHtml}"`); // Optional: log progress
            } else if (child.type === 'link' && child.url) {
                // Ensure children exist for link text, default to URL if not
                let linkText = Array.isArray(child.children) ? renderChildren(child.children) : child.url;
                childHtml += `<a href="${child.url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
            } else {
                 console.warn(`Unhandled child type "${child.type}" or missing data in child ${index}:`, child);
            }
        });
        // console.log("--- Finished rendering children, result:", childHtml); // Optional: log output
        return childHtml;
    }
    // *** END REFINED renderChildren FUNCTION ***


    content.forEach(block => {
        // console.log("Processing block:", block); // Optional: log each block
        if (block.type === 'paragraph') {
            html += `<p>${renderChildren(block.children)}</p>`;
        } else if (block.type === 'heading') {
            const level = block.level || 1;
            html += `<h${level}>${renderChildren(block.children)}</h${level}>`;
        } else if (block.type === 'list') {
            const listType = block.format === 'ordered' ? 'ol' : 'ul';
            html += `<${listType}>`;
            if (Array.isArray(block.children)) {
                block.children.forEach(listItem => {
                    if (listItem.type === 'list-item' && Array.isArray(listItem.children)) {
                        // Directly render the children of the list item
                        html += `<li>${renderChildren(listItem.children)}</li>`;
                    } else {
                         console.warn("Unexpected structure inside list block:", listItem);
                    }
                });
            }
            html += `</${listType}>`;
        } else if (block.type === 'image' && block.image?.url) {
            const altText = block.image.alternativeText || '';
            const imgUrl = block.image.url.startsWith('/') ? strapiBaseUrl + block.image.url : block.image.url;
            html += `<p><img src="${imgUrl}" alt="${altText}" style="max-width: 100%; height: auto; border-radius: 10px;"></p>`;
        } else {
            console.warn("Unhandled block type:", block.type, block);
        }
    });
    return html;
}

// --- Dynamic Backend URL Logic ---
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
function getStrapiBaseUrl() { return isLocal ? 'http://localhost:1337' : 'https://api.monarchdem.me'; }
function getMailServerUrl() { return isLocal ? 'http://localhost:3000' : 'https://mail.monarchdem.me'; }
// --- END Dynamic URL Logic ---

/* --- 4. Functional Contact Form --- */
const contactForm = document.querySelector('#contact-form');
if (contactForm) {
    const submitButton = contactForm.querySelector('button[type="submit"]');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Sending...'; submitButton.disabled = true;
        const formData = { name: contactForm.querySelector('#name').value, email: contactForm.querySelector('#email').value, message: contactForm.querySelector('#message').value };
        const mailUrl = `${getMailServerUrl()}/send-email`;
        fetch(mailUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
        .then(response => { if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`); contactForm.reset(); submitButton.textContent = 'Message Sent!'; })
        .catch(error => { console.error('Contact form error:', error); submitButton.textContent = 'Error. Try Again.'; })
        .finally(() => { setTimeout(() => { submitButton.disabled = false; submitButton.textContent = originalButtonText; }, 3000); });
    });
}

/* --- 5. Dynamic Blog Content --- */
const blogContainer = document.querySelector('#blog-container');
if (blogContainer) { fetchBlogPosts(); }
async function fetchBlogPosts() {
    const STRAPI_BASE_URL = getStrapiBaseUrl();
    const STRAPI_URL = `${STRAPI_BASE_URL}/api/blog-posts?populate=featured_image`;
    try {
        const response = await fetch(STRAPI_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        if (!json.data || !Array.isArray(json.data)) throw new Error('Unexpected API response structure');
        const posts = json.data;
        blogContainer.innerHTML = '';
        if (posts.length === 0) { blogContainer.innerHTML = '<p class="loading-message">No posts found. (Published in Strapi?)</p>'; return; }
        posts.forEach(post => {
            const data = post.attributes || post;
            if (!data || (!data.publishedAt && !data.createdAt) || !data.slug || !data.title) { console.warn('Skipping post missing required fields:', post); return; }
            const dateToUse = data.publishedAt || data.createdAt;
            const postDate = new Date(dateToUse).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            let imageUrl = '';
            if (data.featured_image?.data?.attributes?.url) { imageUrl = STRAPI_BASE_URL + data.featured_image.data.attributes.url; }
            else if (data.featured_image?.url) { imageUrl = data.featured_image.url.startsWith('/') ? STRAPI_BASE_URL + data.featured_image.url : data.featured_image.url;}
            const postElement = document.createElement('article'); postElement.className = 'blog-post-preview';
            const postLink = `blog-post.html?slug=${data.slug}`;
            let postHTML = `
                <div class="post-meta"><span><i class="fas fa-calendar-alt"></i> ${postDate}</span></div>
                <h2><a href="${postLink}">${data.title}</a></h2>
                <a href="${postLink}" class="cta-button project-link">Read More</a>
            `;
            if (imageUrl) { postHTML = `<a href="${postLink}"><img src="${imageUrl}" alt="${data.title || ''}" style="width: 100%; border-radius: 10px; margin-bottom: 1rem;"></a>` + postHTML; }
            postElement.innerHTML = postHTML; blogContainer.appendChild(postElement);
        });
    } catch (error) { console.error('Error fetching blog posts:', error); blogContainer.innerHTML = '<p class="loading-message">Error loading posts. Is Strapi running?</p>'; }
}

/* --- 6. Dynamic Single Blog Post --- */
const postContainer = document.querySelector('#post-content-wrapper');
if (postContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const postSlug = urlParams.get('slug');
    if (postSlug) { fetchSinglePost(postSlug); }
    else { postContainer.innerHTML = '<p class="loading-message">Error: No post specified.</p>'; }
}
async function fetchSinglePost(slug) {
    const STRAPI_BASE_URL = getStrapiBaseUrl();
    const STRAPI_URL = `${STRAPI_BASE_URL}/api/blog-posts?filters[slug][$eq]=${slug}&populate=featured_image`;
    try {
        const response = await fetch(STRAPI_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const json = await response.json();
        if (json.data.length === 0) throw new Error('Post not found.');
        const postData = json.data[0];
        const post = postData.attributes || postData;
        if (!post.publishedAt && !post.createdAt) { console.warn('Post missing date:', postData); throw new Error('Post data incomplete (missing date).'); }
        const dateToUse = post.publishedAt || post.createdAt;
        const postDate = new Date(dateToUse).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        let imageUrl = '';
        if (post.featured_image?.data?.attributes?.url) { imageUrl = STRAPI_BASE_URL + post.featured_image.data.attributes.url; }
        else if (post.featured_image?.url) { imageUrl = post.featured_image.url.startsWith('/') ? STRAPI_BASE_URL + post.featured_image.url : post.featured_image.url; }
        postContainer.innerHTML = '';
        const postDiv = document.createElement('div'); postDiv.className = 'container';
        const contentHtml = convertStrapiContentToHtml(post.content); // Calls helper function
        postDiv.innerHTML = `
            <div class="post-full-header"><h1>${post.title || 'Untitled Post'}</h1><div class="post-meta"><span><i class="fas fa-calendar-alt"></i> ${postDate}</span><span><i class="fas fa-user-edit"></i> By Akinseloyin Elijah (Monarch)</span></div></div>
            <div class="post-full-image">${imageUrl ? `<img src="${imageUrl}" alt="${post.title || ''}">` : ''}</div>
            <div class="post-full-body">${contentHtml}</div>
        `;
        postContainer.appendChild(postDiv); document.title = `${post.title || 'Blog Post'} | Monarch`;
    } catch (error) { console.error('Error fetching single post:', error); postContainer.innerHTML = `<p class="loading-message">Error: ${error.message}</p>`; }
}

/* --- 7. Dynamic Project Content --- */
const projectContainer = document.querySelector('#project-container');
if (projectContainer) { fetchProjects(); }
async function fetchProjects() {
    const STRAPI_BASE_URL = getStrapiBaseUrl();
    const STRAPI_URL = `${STRAPI_BASE_URL}/api/projects?populate=main_image`;
    try {
        const response = await fetch(STRAPI_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const json = await response.json();
        if (!json.data || !Array.isArray(json.data)) throw new Error('Unexpected API response structure for projects');
        const projects = json.data;
        projectContainer.innerHTML = ''; projectContainer.style.display = 'grid'; projectContainer.style.gap = '2rem';
        if (projects.length === 0) { projectContainer.innerHTML = '<p class="loading-message">No projects found. (Published in Strapi?)</p>'; return; }
        projects.forEach(project => {
            const data = project.attributes || project;
            if (!data || !data.title) { console.warn('Skipping malformed project:', project); return; }
            let imageUrl = '';
            if (data.main_image?.data?.attributes?.url) { imageUrl = STRAPI_BASE_URL + data.main_image.data.attributes.url; }
            else if (data.main_image?.url) { imageUrl = data.main_image.url.startsWith('/') ? STRAPI_BASE_URL + data.main_image.url : data.main_image.url;}
            else { console.warn('Main image URL not found for project:', data.title); }
            const projectElement = document.createElement('div'); projectElement.className = 'project-card';
            projectElement.innerHTML = `
                <div class="project-image">${imageUrl ? `<img src="${imageUrl}" alt="${data.title || ''}">` : '[Image placeholder]'}</div>
                <div class="project-content"> 
                    <h3>${data.title}</h3>
                    <p>${data.description || 'No description provided.'}</p>
                    <div class="project-tags"></div>
                    <a href="${data.link || '#'}" target="_blank" class="cta-button project-link">View Project</a>
                </div>
            `;
            projectContainer.appendChild(projectElement);
        });
    } catch (error) { console.error('Error fetching projects:', error); projectContainer.innerHTML = '<p class="loading-message">Error loading projects. Is Strapi running?</p>'; }
}