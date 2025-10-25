# Monarch Personal Website - Frontend

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) This repository contains the frontend code for the personal portfolio and blog website of Akinseloyin Elijah Oluwademilade (Monarch). It showcases projects, skills, and blog posts fetched dynamically from a self-hosted Strapi CMS.

**Live Site:** [Link to live site - e.g., https://monarchdem.me] (Once deployed)

## ✨ Features

* **Modern & Sleek Design:** Dark theme with gold accents and rounded corners.
* **Multi-Page Structure:** Includes Home, About, Services, Projects, Blog, and Contact pages.
* **Dynamic Content:** Blog posts and project details are fetched from a separate Strapi CMS backend.
* **Functional Contact Form:** Sends email notifications via a separate Node.js backend using SendGrid.
* **Responsive Design:** Adapts to various screen sizes with a mobile hamburger menu.
* **Interactive Elements:** Subtle fade-in animations on scroll, back-to-top button.
* **CV Download:** Direct link to download the CV from the About page.

## 🛠️ Tech Stack

* **HTML5**
* **CSS3** (with CSS Variables)
* **JavaScript (Vanilla JS)**: For interactivity and API fetching (`fetch`).
* **Font Awesome:** For icons.
* **Google Fonts (Poppins):** For typography.

## 🚀 Getting Started (Local Development)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/](https://github.com/)[your-username]/[your-repo-name].git
    cd [your-repo-name]
    ```
2.  **Prerequisites:** Ensure you have the backend services running:
    * [Monarch CMS (Strapi)]([Link to your Strapi backend repo]) - Typically runs on `http://localhost:1337`
    * [Monarch Mail Backend (Node.js/SendGrid)]([Link to your Mail backend repo]) - Typically runs on `http://localhost:3000`
3.  **Serve the Frontend:** You can open `index.html` directly in your browser, or use a simple local server (like Apache, Nginx, or VS Code's Live Server extension) to serve the files. Access via the configured local URL (e.g., `http://localhost:8080`).

    *Note:* The JavaScript uses dynamic URLs (`getStrapiBaseUrl`, `getMailServerUrl`) to connect to `localhost` ports when the hostname is `localhost` or `127.0.0.1`.

## 📁 File Structure

├── index.html # Homepage ├── style.css # Main stylesheet ├── script.js # JavaScript for interactivity and API calls ├── pages/ # Sub-pages │ ├── about.html │ ├── blog.html # Blog post list (dynamic) │ ├── blog-post.html # Single blog post template (dynamic) │ ├── contact.html │ ├── projects.html # Projects list (dynamic) │ └── services.html ├── img/ # Site images (e.g., logo, placeholders, your photo) ├── my-cv.pdf # CV file linked from About page ├── README.md # This file └── .gitignore # Files/folders ignored by Git


## ☁️ Deployment

This frontend is currently deployed via [Deployment Method - e.g., Apache on local machine with Cloudflare Tunnel]. The backend services (CMS and Mail) are also self-hosted and exposed via Cloudflare Tunnels.

* **Frontend:** `https://monarchdem.me` -> `http://localhost:8080`
* **CMS API:** `https://api.monarchdem.me` -> `http://localhost:1337`
* **Mail API:** `https://mail.monarchdem.me` -> `http://localhost:3000`

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page]([Link to issues page if public]).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (if you add one).

---

_Created by Akinseloyin Elijah Oluwademilade (Monarch)_