# Monarch Personal Website - Frontend

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) **Live Site:** [https://monarchdem.me](https://monarchdem.me) ---

## 📜 Overview

This repository hosts the frontend code for the personal portfolio and blog of **Akinseloyin Elijah Oluwademilade (Monarch)**, a Computer Engineering student at the University of Lagos. The site serves as a digital presence to showcase skills, completed projects, and share insights via a blog.

It features a modern, responsive design with a distinct dark theme accented by gold, and dynamically loads content (blog posts, projects) from a self-hosted Strapi CMS backend.

---

## ✨ Key Features

* **Modern Aesthetic:** Dark theme, gold accents, Poppins font, rounded corners, and subtle animations.
* **Dynamic Content:** Seamless integration with a headless Strapi CMS for blog posts and project showcases.
* **Fully Responsive:** Adapts gracefully to desktops, tablets, and mobile devices using CSS media queries and a hamburger menu.
* **Interactive UI:** Includes scroll-triggered fade-in animations and a "Back to Top" button.
* **Functional Contact Form:** Connects to a dedicated Node.js/SendGrid backend for reliable email notifications.
* **Key Information:** Includes sections for About Me, Services/Skills, Projects Portfolio, Blog, and Contact.
* **CV Download:** Provides a direct download link for the user's Curriculum Vitae.

---

## 🛠️ Technology Stack

* **Core:** HTML5, CSS3 (with Variables/Custom Properties), Vanilla JavaScript (ES6+)
* **API Interaction:** `fetch` API for asynchronous calls to backend services.
* **Styling Aids:**
    * [Font Awesome](https://fontawesome.com/): For iconography.
    * [Google Fonts](https://fonts.google.com/): Utilizes the 'Poppins' font family.
* **Backend Services (Separate Repositories):**
    * CMS: [Strapi](https://strapi.io/) (Self-hosted)
    * Mail Service: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [@sendgrid/mail](https://github.com/sendgrid/sendgrid-nodejs) (Self-hosted)

---

## 🚀 Local Development Setup

### Prerequisites

* A local web server (Apache, Nginx, or a development server like VS Code's Live Server). Apache configured on port 8080 is used in the current setup.
* Running instances of the backend services:
    * **Monarch CMS (Strapi):** Typically running on `http://localhost:1337`. ([Link to your Strapi backend repo])
    * **Monarch Mail Backend:** Typically running on `http://localhost:3000`. ([Link to your Mail backend repo])

### Steps

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/](https://github.com/)[your-username]/[your-repo-name].git
    cd [your-repo-name]
    ```
2.  **Configure Local Server:** Set up your chosen web server to serve the contents of this repository. For Apache, ensure the Virtual Host configuration points to this directory and listens on the desired port (e.g., 8080).
3.  **Access:** Open your browser and navigate to the local URL (e.g., `http://localhost:8080`). The site should connect to the locally running backend services.

---

## ☁️ Deployment Architecture

This project utilizes a self-hosted architecture exposed securely via Cloudflare Tunnels:

* **Frontend (`monarch-website`):** Served by Apache locally on port `8080`. Tunneled to `https://monarchdem.me`.
* **CMS API (`monarch-cms`):** Strapi instance running locally on port `1337`. Tunneled to `https://api.monarchdem.me`.
* **Mail API (`monarch-backend`):** Node.js/Express/SendGrid server running locally on port `3000`. Tunneled to `https://mail.monarchdem.me`.

The frontend JavaScript (`script.js`) dynamically selects the correct API endpoints (local or production) based on the `window.location.hostname`.

---

## 🤝 Contributing

While this is a personal project, suggestions and feedback are welcome. Please feel free to open an issue if you spot bugs or have ideas for improvement. ([Link to issues page if public])

---

## 📝 License

Distributed under the MIT License. See `LICENSE` file for more information (if you choose to add one).

---

_Developed with ❤️ by Akinseloyin Elijah Oluwademilade (Monarch)_
