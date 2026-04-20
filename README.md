# Go Backend Interview Prep

[![Validate](https://img.shields.io/github/actions/workflow/status/can4hou6joeng4/interview-prep/validate.yml?branch=main&label=validate&style=flat-square)](https://github.com/can4hou6joeng4/interview-prep/actions/workflows/validate.yml)
[![Pages](https://img.shields.io/github/deployments/can4hou6joeng4/interview-prep/github-pages?label=github%20pages&style=flat-square)](https://can4hou6joeng4.github.io/interview-prep/)
[![License](https://img.shields.io/github/license/can4hou6joeng4/interview-prep?style=flat-square)](./LICENSE)
[![Stars](https://img.shields.io/github/stars/can4hou6joeng4/interview-prep?style=flat-square)](https://github.com/can4hou6joeng4/interview-prep/stargazers)

Open-source interview prep toolkit for Go backend roles, combining a GitHub Pages flashcard site with a native iOS study app focused on review loops, lightweight note-taking, and structured recall.

[中文说明](./README_zh.md)
[Changelog](./CHANGELOG.md)

## Highlights

- 19 categories and 203 questions across Go, MySQL, Redis, Kafka, Kubernetes, system design, AI engineering, and project deep dives
- Native iOS app built with SwiftUI, featuring a study dashboard, review queue, theme switching, lightweight note capture, and progress sync
- Native iOS app now supports multiple accent palettes alongside system/light/dark appearance switching
- Native iOS app home now highlights streak days, weekly review volume, and monthly topic coverage
- Review completion screen reports mastery rate and routes users back to the topic that needs more work
- Three learning modes: flashcards, searchable list view, and mock interview drills with score write-back
- Curated learning paths now group the bank into commerce, platform, realtime, project deep-dive, and sprint tracks
- Dedicated weak-review entry now lets you jump into wrong-answer, fuzzy, weak, and mastered-only review within the current learning path
- Tag-based filtering now supports quick review of project-heavy and scenario-heavy questions
- Mock summary now shows weak-category breakdowns and next-round recommendations
- Combined filters for category, difficulty, search, unknown items, and random order
- Stable question IDs with browser-side progress persistence and legacy progress migration
- Zero-build static architecture, designed for GitHub Pages deployment
- Every question and category now has a dedicated static page (`q/*.html`, `c/*.html`) for long-tail search indexing
- Repository-level validation keeps README stats, SEO metadata, and required site assets in sync

## Product Surfaces

### GitHub Pages

- Home dashboard with learning-path shortcuts and static SEO-friendly question/category pages
- Flashcards, searchable list mode, and mock interview drills for browser-based practice

### iOS App

- Native study dashboard with “what to study next” actions
- Streak tracking with daily / weekly / monthly study metrics on the home board
- Dedicated review queue for weak/favorited items, plus a completion screen with mastery rate and topic-level recommendations
- Category bank with status filters (unstarted / learning / mastered / favorited) and per-category mastery progress
- Search results come with quick actions to favorite, mark-as-learning, and jump into the owning topic
- Question detail now ships a one-tap toggle to add the current question into the today review queue
- My-tab note module supports keyword search across note body, question title, and category
- Settings page exposes JSON export and one-tap reset for the local learning state
- Adaptive light/dark/system theme support
- Accent palette presets for different reading moods and visual preferences
- In-app note capture and recent-note surfacing for knowledge accumulation

![iOS dashboard](./assets/ios-dashboard.jpg)

![iOS review queue](./assets/ios-review-session.jpg)

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
├── q/                         # 203 static question pages (generated)
├── c/                         # 19 static category pages (generated)
├── assets/
│   ├── app.js
│   ├── data.js
│   ├── favicon.svg
│   ├── ios-dashboard.jpg
│   ├── ios-review-session.jpg
│   └── styles.css
├── ios/
│   ├── InterviewPrep.xcodeproj
│   ├── InterviewPrep/
│   └── README.md
├── scripts/
│   ├── build-pages.mjs
│   ├── check-fast.sh
│   ├── check-full.sh
│   ├── slug.mjs
│   ├── validate-data.mjs
│   ├── validate-pages.mjs
│   └── validate-site.mjs
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   ├── dependabot.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── index.html
├── study.html
├── mock.html
├── 404.html
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── CHANGELOG.md
├── LICENSE
├── README.md
├── README_zh.md
├── robots.txt
├── sitemap.xml
├── site.webmanifest
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

## Static Page Build

Every time `assets/data.js` changes, regenerate the static question/category pages and sitemap:

```bash
node scripts/build-pages.mjs              # regenerate q/ c/ sitemap.xml
node scripts/build-pages.mjs --dry-run    # preview without writing
```

Generated files under `q/` and `c/` are checked into git because GitHub Pages does not run build steps. CI will fail if the committed output drifts from `data.js`.

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
- GitHub Discussions is enabled for ideas, Q&A, and longer-form collaboration

## Roadmap Ideas

- ~~wrong-answer / weak-topic mode~~ — shipped in v2026-04-08
- exportable question packs
- scheduled review plans
