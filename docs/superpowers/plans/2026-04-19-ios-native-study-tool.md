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

- [x] Narrow the app visual system away from strict web parity and toward a calmer study-first language.
- [x] Keep reusable primitives for cards, chips, and buttons so follow-up screens can be refactored without re-inventing styling rules.

### Task 2: Make home a real study dashboard

**Files:**
- Modify: `ios/InterviewPrep/Features/Categories/CategoryListView.swift`
- Modify: `ios/InterviewPrep/Features/Root/RootView.swift` if dashboard actions need routing support

- [x] Prioritize “what should I study now?” over broad catalog browsing.
- [x] Surface today/review/continue actions before the category catalog.
- [x] Preserve category access, but demote it below active study tasks.

### Task 3: Calm the browsing surface

**Files:**
- Modify: `ios/InterviewPrep/Features/Questions/QuestionListView.swift`
- Modify: `ios/InterviewPrep/Features/Search/SearchView.swift`

- [x] Make list rows faster to scan with clearer title/meta/tag hierarchy.
- [x] Reduce decorative competition so search and category browsing feel more native and less poster-like.

### Task 4: Complete the review loop

**Files:**
- Modify: `ios/InterviewPrep/Features/Questions/QuestionDetailView.swift`
- Modify: `ios/InterviewPrep/Features/Random/RandomView.swift`
- Modify: `ios/InterviewPrep/Features/My/MyView.swift`

- [x] Keep the recall-first detail flow, but add clearer next actions after revealing the answer.
- [x] Ensure random study and library entry points feed back into the same loop instead of dead-ending.
- [x] Make “My” act as a lightweight study control center instead of a passive archive.

### Task 5: Verify in simulator

**Files:**
- No source changes expected

- [x] Build the app for iOS Simulator.
- [x] Install and launch the new build.
- [x] Capture screenshots of the dashboard and the review flow to confirm the redesign actually renders as intended.

---

## Follow-up Increments (2026-04-20)

Work extending the original five tasks while staying within the same product direction:

- [x] **Review completion upgrade** — replace the minimal “done” card with a mastery-rate ring, per-topic breakdown, weakest-topic recommendation, and topic-level jump (`Features/Review/ReviewCompletionView.swift`, `Core/Services/AppIntents.swift`, `Features/Root/RootView.swift`).
- [x] **Search quick actions** — each result row now exposes a native Menu to favorite, mark-as-learning, or jump into the owning topic, with inline status badges (`Features/Search/SearchView.swift`).
- [x] **Category mastery view** — question list gains per-category mastery progress and status filters so users land on “not yet mastered” questions by default (`Features/Questions/QuestionListView.swift`).
- [x] **Home streak module** — dashboard surfaces streak days, weekly review volume, and monthly topic coverage to drive retention (`Features/Categories/CategoryListView.swift`).
