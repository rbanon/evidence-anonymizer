# GitHub Evidence Anonymizer

A browser-based tool for generating anonymized commit-history reports from GitHub, GitLab, and Bitbucket repositories. Everything runs client-side — no data leaves your browser.

## Features

- **Multi-platform**: GitHub, GitHub Enterprise Server, GitLab (cloud & self-hosted), Bitbucket Server, Bitbucket Cloud
- **Anonymization rules**: replace names, emails, or any text with custom substitutions; auto-anonymize email addresses
- **Flexible layouts**: group commits by day, by repository, or flat list
- **PDF export**: browser print dialog, with optional per-author split
- **i18n**: English and Spanish UI

## Stack

- Vue 3 (Composition API, `<script setup>`)
- Vite + TypeScript + SCSS
- vue-i18n v10, date-fns

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build   # type-check + Vite bundle
npm run preview # serve the dist folder
```

## Usage

1. Select your platform and enter credentials (token / App Password) if needed
2. Add one or more repositories (`owner/repo` or full URL)
3. Set a date range and optional author filter
4. Add anonymization rules if required
5. Click **Generate** and download the PDF

Credentials are used only in the browser and are never stored or sent anywhere except to the target platform API.

## Project layout

```
src/
  components/     Vue components (AppHeader, ConfigPanel, ReportPreview, CommitCard, …)
  composables/    useTheme
  i18n/locales/   en.ts, es.ts
  services/       platform.ts, github.ts, gitlab.ts, bitbucket.ts, reportGenerator.ts, anonymizer.ts
  types/          index.ts
  utils/          dates.ts, text.ts
  styles/         main.scss
IDI/              reference scripts (do not delete)
```
