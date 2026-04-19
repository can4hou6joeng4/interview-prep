# iOS Native Study Tool Rebuild Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the iOS app from a web-style branded shell into a calmer native study tool that feels closer to modern flashcard and memory apps.

**Architecture:** Keep the existing data model and navigation shell, but shift UI emphasis toward daily study actions, scan-friendly lists, and a complete review loop in question detail. Shared theme tokens should support a lower-noise native interface, while the dashboard highlights only the highest-value actions.

**Tech Stack:** SwiftUI, SwiftData, WKWebView, Xcode project at `ios/InterviewPrep.xcodeproj`

---

### Task 1: Stabilize the redesign direction

**Files:**
- Create: `docs/superpowers/plans/2026-04-19-ios-native-study-tool.md`
- Modify: `ios/InterviewPrep/Core/Theme/Theme.swift`

- [ ] Narrow the app visual system away from strict web parity and toward a calmer study-first language.
- [ ] Keep reusable primitives for cards, chips, and buttons so follow-up screens can be refactored without re-inventing styling rules.

### Task 2: Make home a real study dashboard

**Files:**
- Modify: `ios/InterviewPrep/Features/Categories/CategoryListView.swift`
- Modify: `ios/InterviewPrep/Features/Root/RootView.swift` if dashboard actions need routing support

- [ ] Prioritize “what should I study now?” over broad catalog browsing.
- [ ] Surface today/review/continue actions before the category catalog.
- [ ] Preserve category access, but demote it below active study tasks.

### Task 3: Calm the browsing surface

**Files:**
- Modify: `ios/InterviewPrep/Features/Questions/QuestionListView.swift`
- Modify: `ios/InterviewPrep/Features/Search/SearchView.swift`

- [ ] Make list rows faster to scan with clearer title/meta/tag hierarchy.
- [ ] Reduce decorative competition so search and category browsing feel more native and less poster-like.

### Task 4: Complete the review loop

**Files:**
- Modify: `ios/InterviewPrep/Features/Questions/QuestionDetailView.swift`
- Modify: `ios/InterviewPrep/Features/Random/RandomView.swift`
- Modify: `ios/InterviewPrep/Features/My/MyView.swift`

- [ ] Keep the recall-first detail flow, but add clearer next actions after revealing the answer.
- [ ] Ensure random study and library entry points feed back into the same loop instead of dead-ending.
- [ ] Make “My” act as a lightweight study control center instead of a passive archive.

### Task 5: Verify in simulator

**Files:**
- No source changes expected

- [ ] Build the app for iOS Simulator.
- [ ] Install and launch the new build.
- [ ] Capture screenshots of the dashboard and the review flow to confirm the redesign actually renders as intended.
