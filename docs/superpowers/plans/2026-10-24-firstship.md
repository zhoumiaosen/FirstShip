# FirstShip Implementation Plan

> **For agentic workers:** Execute focused tasks with independent domain and UI ownership, then review the integrated app.

**Goal:** Deliver the approved FirstShip hackathon journey and public Git repository.
**Architecture:** React client with browser-local persistence; Node server with server-only optional AI.
**Tech Stack:** React, Vite, Node built-ins, Playwright.
**Spec:** devpost/spec.md and devpost/prd.md

## Global Constraints
One browser-local project. No calendar locks. No false verification claims. No credentials in the browser or Git. Use installed Devpost Learn skills and preserve learner ownership.
## Review Focus
Storage corruption/quota; unknown idea scoping; empty/reflection completion; upstream failure/malformed AI; help input retention and responsive navigation.

### Task 1: Personal plan and saved journey
Files: src/lib/domain.js, src/lib/storage.js, src/lib/domain.test.js, src/App.jsx, src/styles.css.
- [ ] Define common interfaces in devpost/spec.md.
- [ ] Write domain tests for distinct ideas, bounded scope, completion validation, malformed storage; observe failure then implement.
- [ ] Build welcome, onboarding, editable scope and dashboard; save browser-local progress.
- [ ] Verify node tests and build, commit working journey.

### Task 2: Learn, recover and finish
Files: src/App.jsx, src/lib/domain.js, server/coach.js, server/index.js, server/coach.test.js.
- [ ] Write failing tests for schema validation, upstream failure and server boundaries.
- [ ] Implement all task cards, help panel, copy/retry, reflection gates, summary export.
- [ ] Implement optional live AI with explicit guided mode and server-only secrets.
- [ ] Run node tests, build and browser core journey; commit.

### Task 3: Review and publish
Files: tests/journey.spec.js, README.md, LICENSE, .github/workflows/check.yml.
- [ ] Verify return visits, day navigation, help errors, mobile layout, no secrets and clean production build.
- [ ] Fresh-agent review; fix important findings with regression tests.
- [ ] Commit; create public GitHub repository and push if authenticated credentials allow. Report exact blocker otherwise.
