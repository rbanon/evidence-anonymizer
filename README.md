# 🕵️ GitHub Evidence Anonymizer

A browser-based tool for generating anonymized commit-history reports from GitHub, GitLab, and Bitbucket repositories. Everything runs **client-side** — no data ever leaves your browser.

[![Built with Vue 3](https://img.shields.io/badge/built%20with-Vue%203-4FC08D?style=flat-square&logo=vue.js)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)]()
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite)]()

## ✨ Features

### 🔗 Multi-Platform Support
- **GitHub** (cloud & GitHub Enterprise Server)
- **GitLab** (cloud & self-hosted)
- **Bitbucket** Server and Bitbucket Cloud

### 🎭 Anonymization Rules
- Replace names, emails, or any text with custom substitutions
- Auto-anonymize email addresses
- Configurable rule set per report

### 📐 Flexible Layouts
- Group commits by **day**
- Group commits by **repository**
- **Flat list** view

### 📄 PDF Export
- Export via browser print dialog
- Optional **per-author split** for individual reports

### 🌐 Internationalization (i18n)
- **English and Spanish** UI
- Real-time language switching

## 🛠️ Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| **Framework** | Vue 3 + Composition API | Modern, reactive, performant |
| **Language** | TypeScript | Type-safe, better development |
| **Bundler** | Vite | Fast, current standard |
| **Styles** | Custom SCSS | No UI library dependencies |
| **i18n** | vue-i18n v10 | Professional multi-language |
| **Dates** | date-fns | Lightweight date utilities |

## 📦 Installation

### Requirements
- Node.js 16+
- npm or yarn

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/github-evidence-anonymizer.git
cd github-evidence-anonymizer

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

## 🚀 Usage

1. **Select your platform** (GitHub, GitLab, or Bitbucket)
2. **Enter credentials** (token / App Password) if needed for private repos
3. **Add repositories** using `owner/repo` format or full URL
4. **Set a date range** and optional author filter
5. **Add anonymization rules** to replace sensitive information
6. **Click Generate** and download the PDF

> Credentials are used only in the browser and are never stored or sent anywhere except to the target platform API.

## 📁 Project Structure

```
src/
├── components/          # Vue components
│   ├── AppHeader.vue    # Sticky header with controls
│   ├── ConfigPanel.vue  # Platform and repo configuration
│   ├── ReportPreview.vue# Live report preview
│   └── CommitCard.vue   # Individual commit card
├── composables/
│   └── useTheme.ts      # Dark/light mode logic
├── services/
│   ├── platform.ts      # Platform abstraction layer
│   ├── github.ts        # GitHub API integration
│   ├── gitlab.ts        # GitLab API integration
│   ├── bitbucket.ts     # Bitbucket API integration
│   ├── anonymizer.ts    # Anonymization engine
│   └── reportGenerator.ts # PDF report generation
├── i18n/
│   └── locales/
│       ├── en.ts        # English translations
│       └── es.ts        # Spanish translations
├── types/
│   └── index.ts         # Type interfaces
├── utils/
│   ├── dates.ts         # Date utilities
│   └── text.ts          # Text processing utilities
└── styles/
    └── main.scss        # Global styles & variables
```

## 🎨 Themes

### Dark Mode (Default)
```scss
--bg-primary:     #0d1117
--text-primary:   #e6edf3
--accent:         #58a6ff
```

### Light Mode
```scss
--bg-primary:     #ffffff
--text-primary:   #1f2328
--accent:         #0969da
```

## 🚦 Available Scripts

```bash
npm run dev        # Start Vite server at http://localhost:5173
npm run build      # Build for production (dist/)
npm run preview    # Preview the build
npm run type-check # Check TypeScript types
```

## 🌍 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or simply connect the repo at [vercel.com](https://vercel.com)

## 📝 License

This project is under the MIT license. See [LICENSE](./LICENSE) for details.

## 👨‍💻 Author

Created by Rafael Bañón - Logo crateaad by Vecteezy

## 🐛 Issues & Support

Found a bug? [Open an issue](../../issues/new)

## 🙏 Acknowledgments

- [Vue 3](https://vuejs.org/)
- [vue-i18n](https://vue-i18n.intlify.dev/)
- [date-fns](https://date-fns.org/)
- [Vite](https://vitejs.dev/)

---

**⭐ If you like the project, don't forget to leave a star!**

[Back to top ⬆️](#️-github-evidence-anonymizer)
