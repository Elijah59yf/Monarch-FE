<div align="center">

# モナーク

### **MONARCH**

*Where precision meets purpose*

[![Live Site](https://img.shields.io/badge/🌐_Live_Site-monarchdem.me-1a1a2e?style=for-the-badge&labelColor=0d0d0d)](https://monarchdem.me)
[![GitHub](https://img.shields.io/badge/GitHub-Elijah59yf-1a1a2e?style=for-the-badge&logo=github&labelColor=0d0d0d)](https://github.com/Elijah59yf)

<br>

<img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5"/>
<img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3"/>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript"/>
<img src="https://img.shields.io/badge/Strapi-2F2E8B?style=flat-square&logo=strapi&logoColor=white" alt="Strapi"/>
<img src="https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare"/>

</div>

<br>

---

<br>

## ✦ Overview

A personal portfolio and digital journal for **Akinseloyin Elijah Oluwademilade (Monarch)** — Computer Engineering student at the University of Lagos. 

This site embodies a design philosophy where **Japanese minimalism meets Scandinavian functionality** — clean lines, purposeful whitespace, and an understated elegance that lets the work speak for itself.

<br>

## ✦ Design Philosophy

```
精密 (Precision)  ·  目的 (Purpose)  ·  職人技 (Craftsmanship)
```

| Aspect | Approach |
|:-------|:---------|
| **Typography** | Cormorant Garamond × DM Sans — editorial elegance meets modern clarity |
| **Color Palette** | Deep charcoal, muted gold accents, warm stone tones |
| **Layout** | Asymmetric grids with generous breathing room |
| **Interaction** | Subtle fade-ins, smooth transitions, micro-animations |

<br>

## ✦ Features

<table>
<tr>
<td width="50%">

### 🎨 Aesthetic
- Dark theme with gold accents
- Japanese-inspired minimalism
- Scroll-triggered animations
- Responsive across all devices

</td>
<td width="50%">

### ⚡ Functional
- Dynamic CMS integration
- Blog & project showcases  
- CV download capability

</td>
</tr>
</table>

<br>

## ✦ Architecture

```
                    ┌─────────────────────────────────────┐
                    │         Cloudflare Tunnels          │
                    └──────────────┬──────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
   │  Frontend   │         │  Strapi CMS │         │ Mail Server │
   │   :8080     │         │   :1337     │         │   :3000     │
   └─────────────┘         └─────────────┘         └─────────────┘
   monarchdem.me         api.monarchdem.me       mail.monarchdem.me
```

<br>

## ✦ Tech Stack

<details>
<summary><b>Frontend</b></summary>
<br>

| Technology | Purpose |
|:-----------|:--------|
| HTML5 | Semantic structure |
| CSS3 | Custom properties, Grid, Flexbox |
| Vanilla JS | ES6+ modules, Fetch API |
| SVG sprite | Iconography (assets/icons/monarch-icons.svg) |
| Self-hosted fonts | Cormorant Garamond, DM Sans (woff2); system fonts for Japanese |

</details>

<details>
<summary><b>Backend Services</b></summary>
<br>

| Service | Stack | Repository |
|:--------|:------|:-----------|
| CMS | Strapi (Self-hosted) | [Monarch-Strapi-BE](https://github.com/Elijah59yf/Monarch-Strapi-BE) |
| Mail | Node.js + Express + SendGrid | [Monarch-Mail-BE](https://github.com/Elijah59yf/Monarch-Mail-BE) |

</details>

<details>
<summary><b>Infrastructure</b></summary>
<br>

- **Web Server:** Apache
- **Tunneling:** Cloudflare Tunnels
- **DNS:** Cloudflare

</details>

<br>

## ✦ Project Structure

```
Monarch-FE/
│
├── index.html              # Landing page
├── style.css               # Global styles
├── script.js               # Core functionality
│
├── pages/
│   ├── about.html          # Biography & journey
│   ├── services.html       # Skills & expertise
│   ├── projects.html       # Portfolio showcase
│   ├── blog.html           # Journal entries
│   └── blog-post.html      # Single post view
│
├── img/                    # Static assets
└── my-cv.pdf               # Curriculum Vitae
```

<br>

## ✦ Getting Started

### Prerequisites

- Local web server (Apache/Nginx/Live Server)
- Backend services running:
  - Strapi CMS → `localhost:1337`
  - Mail API → `localhost:3000`

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Elijah59yf/Monarch-FE.git

# Navigate to directory
cd Monarch-FE

# Serve with your preferred method
# Option 1: VS Code Live Server
# Option 2: Python
python -m http.server 8080

# Option 3: Node.js
npx serve -p 8080
```

<br>

## ✦ Related Repositories

| Repository | Description |
|:-----------|:------------|
| [Monarch-Strapi-BE](https://github.com/Elijah59yf/Monarch-Strapi-BE) | Headless CMS for blog posts & projects |

<br>

## ✦ Contributing

Contributions are welcome. For major changes, please open an issue first to discuss what you would like to change.

[![Issues](https://img.shields.io/github/issues/Elijah59yf/Monarch-FE?style=flat-square&color=1a1a2e)](https://github.com/Elijah59yf/Monarch-FE/issues)

<br>

## ✦ License

This project is licensed under the [MIT License](LICENSE).

<br>

---

<div align="center">

<br>

*Crafted with intention*

**モナーク · MONARCH · 2026**

<br>

</div>


