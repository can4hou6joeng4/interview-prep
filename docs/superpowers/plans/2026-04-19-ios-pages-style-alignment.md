# iOS Pages Style Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the native iOS app visually align with the repository's current GitHub Pages Neo-Brutalism style.

**Architecture:** Rebuild the shared SwiftUI theme around the Web token system first, then restyle the highest-traffic screens to use the same background, borders, shadows, chips, and CTA language. Keep data flow and navigation unchanged so the change stays visual-first and low risk.

**Tech Stack:** SwiftUI, SwiftData, WKWebView, Xcode project at `ios/InterviewPrep.xcodeproj`

---

### Task 1: Rebuild Shared Theme Tokens

**Files:**
- Modify: `ios/InterviewPrep/Core/Theme/Theme.swift`

- [ ] Replace the current dark Linear-inspired token set with a light Neo-Brutalism token set derived from `assets/styles.css`.
- [ ] Add reusable view modifiers and small controls for block cards, offset shadows, brutal buttons, and bordered chips.
- [ ] Keep existing call sites compiling by preserving helper entry points where practical.

### Task 2: Restyle Core Learning Screens

**Files:**
- Modify: `ios/InterviewPrep/App/InterviewPrepApp.swift`
- Modify: `ios/InterviewPrep/Features/Categories/CategoryListView.swift`
- Modify: `ios/InterviewPrep/Features/Questions/QuestionListView.swift`
- Modify: `ios/InterviewPrep/Features/Questions/QuestionDetailView.swift`

- [ ] Update global navigation and tab chrome so the app shell matches the Web visual language.
- [ ] Restyle the category home to match the homepage stat cards, section titles, and path-card feel.
- [ ] Restyle the question list and detail screens to use square cards, bold chips, yellow headers, and stronger CTA hierarchy.

### Task 3: Align Supporting Screens

**Files:**
- Modify: `ios/InterviewPrep/Features/Search/SearchView.swift`
- Modify: `ios/InterviewPrep/Features/My/MyView.swift`
- Modify: `ios/InterviewPrep/Features/Random/RandomView.swift`
- Modify: `ios/InterviewPrep/Features/Settings/SettingsView.swift`
- Modify: `ios/InterviewPrep/Features/Questions/NoteEditorSheet.swift`

- [ ] Convert supporting screens to the same card, button, and typography system.
- [ ] Ensure empty states, editors, and settings rows still read clearly with the lighter background and heavier border treatment.

### Task 4: Verify Build Health

**Files:**
- No source changes expected

- [ ] Run the iOS simulator build for scheme `InterviewPrep`.
- [ ] Report verification status and any residual risks from the visual-only refactor.
