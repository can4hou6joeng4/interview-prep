# Go Backend Interview Prep

[![Validate](https://img.shields.io/github/actions/workflow/status/can4hou6joeng4/interview-prep/validate.yml?branch=main&label=validate&style=flat-square)](https://github.com/can4hou6joeng4/interview-prep/actions/workflows/validate.yml)
[![Pages](https://img.shields.io/github/deployments/can4hou6joeng4/interview-prep/github-pages?label=github%20pages&style=flat-square)](https://can4hou6joeng4.github.io/interview-prep/)
[![License](https://img.shields.io/github/license/can4hou6joeng4/interview-prep?style=flat-square)](./LICENSE)
[![Stars](https://img.shields.io/github/stars/can4hou6joeng4/interview-prep?style=flat-square)](https://github.com/can4hou6joeng4/interview-prep/stargazers)

Interactive flashcard-style interview prep for Go backend roles, tailored around real project experience, system design depth, and structured review workflows.

[中文说明](./README_zh.md)
[Changelog](./CHANGELOG.md)

## Highlights

- 19 categories and 158 questions across Go, MySQL, Redis, Kafka, Kubernetes, system design, AI engineering, and project deep dives
- Three learning modes: flashcards, searchable list view, and mock interview drills with score write-back
- Curated learning paths now group the bank into commerce, platform, realtime, project deep-dive, and sprint tracks
- Dedicated weak-review entry now lets you jump into wrong-answer, fuzzy, weak, and mastered-only review within the current learning path
- Tag-based filtering now supports quick review of project-heavy and scenario-heavy questions
- Mock summary now shows weak-category breakdowns and next-round recommendations
- Combined filters for category, difficulty, search, unknown items, and random order
- Stable question IDs with browser-side progress persistence and legacy progress migration
- Zero-build static architecture, designed for GitHub Pages deployment
- Repository-level validation keeps README stats, SEO metadata, and required site assets in sync

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
│   ├── interview-experience-map.md
│   ├── jd-questions.md
│   └── shoply-deep-dive.md
├── scripts/
│   ├── check-fast.sh
│   ├── check-full.sh
│   ├── jd-coverage.mjs
│   ├── jd-keywords.json
│   ├── validate-data.mjs
│   └── validate-site.mjs
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── CHANGELOG.md
├── 404.html
├── LICENSE
├── README.md
├── README_zh.md
├── robots.txt
└── SECURITY.md
```

## Development Notes

- Runtime question data lives in `assets/data.js`
- Interaction logic lives in `assets/app.js`
- Source notes and expansion backlog live under `content-sources/`
- GitHub Pages only deploys the site artifact, not the full repo contents
- The static site includes a custom `404.html`, `robots.txt`, `site.webmanifest`, and `sitemap.xml` for a more complete deployment surface

## Validation

```bash
./scripts/check-fast.sh
./scripts/check-full.sh
```

## JD Coverage Audit

Use the coverage scanner to compare recurring JD keywords against the current bank:

```bash
node scripts/jd-coverage.mjs
node scripts/jd-coverage.mjs --json
node scripts/jd-coverage.mjs --strict
```

- `scripts/jd-keywords.json` stores the curated keyword sets
- default mode prints a report without failing your shell
- `--strict` is useful when you want missing coverage to fail a pipeline or manual gate

## Local Hooks

Enable repository-local Git hooks with:

```bash
./scripts/setup-hooks.sh
```

This configures:

- `pre-commit` → `./scripts/check-fast.sh`
- `pre-push` → `./scripts/check-full.sh`

These hooks reduce manual validation work locally, but they do not replace pushing to GitHub. GitHub Pages still updates only after a remote push triggers the workflow.

## Community

- [Contributing Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)

## Roadmap Ideas

- ~~wrong-answer / weak-topic mode~~ — shipped in v2026-04-08
- exportable question packs
- scheduled review plans
