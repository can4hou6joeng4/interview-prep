# Go Backend Interview Prep

[![Validate](https://img.shields.io/github/actions/workflow/status/can4hou6joeng4/interview-prep/validate.yml?branch=main&label=validate&style=flat-square)](https://github.com/can4hou6joeng4/interview-prep/actions/workflows/validate.yml)
[![Pages](https://img.shields.io/github/deployments/can4hou6joeng4/interview-prep/github-pages?label=github%20pages&style=flat-square)](https://can4hou6joeng4.github.io/interview-prep/)
[![License](https://img.shields.io/github/license/can4hou6joeng4/interview-prep?style=flat-square)](./LICENSE)
[![Stars](https://img.shields.io/github/stars/can4hou6joeng4/interview-prep?style=flat-square)](https://github.com/can4hou6joeng4/interview-prep/stargazers)

Interactive flashcard-style interview prep for Go backend roles, tailored around real project experience, system design depth, and structured review workflows.

[中文说明](./README_zh.md)

## Highlights

- 19 categories and 114 questions across Go, MySQL, Redis, Kafka, Kubernetes, system design, AI engineering, and project deep dives
- Dual learning modes: flashcards for focused review and list mode for search-heavy browsing
- Combined filters for category, difficulty, search, unknown items, and random order
- Stable question IDs with browser-side progress persistence and legacy progress migration
- Zero-build static architecture, designed for GitHub Pages deployment

## Live Demo

- Repository: [github.com/can4hou6joeng4/interview-prep](https://github.com/can4hou6joeng4/interview-prep)
- Site: [can4hou6joeng4.github.io/interview-prep](https://can4hou6joeng4.github.io/interview-prep/)

## Local Preview

```bash
python3 -m http.server 4173
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Repository Structure

```text
.
├── assets/
│   ├── app.js
│   ├── data.js
│   ├── favicon.svg
│   └── styles.css
├── content-sources/
│   ├── README.md
│   ├── jd-questions.md
│   └── shoply-deep-dive.md
├── scripts/
│   └── validate-data.mjs
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE
├── README.md
├── README_zh.md
└── SECURITY.md
```

## Development Notes

- Runtime question data lives in `assets/data.js`
- Interaction logic lives in `assets/app.js`
- Source notes and expansion backlog live under `content-sources/`
- GitHub Pages only deploys the site artifact, not the full repo contents

## Validation

```bash
node --check assets/app.js
node --check assets/data.js
node scripts/validate-data.mjs
```

## Community

- [Contributing Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)

## Roadmap Ideas

- tag-based review mode
- wrong-answer / weak-topic mode
- exportable question packs
- scheduled review plans
