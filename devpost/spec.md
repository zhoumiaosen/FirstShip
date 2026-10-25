---
status: implementation-authorized
---
# FirstShip technical specification

## Architecture
A React + Vite browser application. All course scoping, lesson prompts, troubleshooting checklists, progress and exports run on the learner’s device. There is no AI integration, paid API, application backend, account or database.

## Components and File Structure
- src/App.jsx: welcome, onboarding, editable plan, course journey, lessons, help and summary.
- src/lib/domain.js: idea reduction, five-day curriculum, completion and Markdown export.
- src/lib/guidance.js: pure troubleshooting checklist and prompt creation.
- src/lib/storage.js: versioned browser persistence, validation and legacy progress migration.
- server/index.js: read-only local development/static preview server; no coaching endpoints.
- docs/index.html and docs/site.css: introduction website.
- docs/app/: generated published course, built with npm run build:site.
- scripts/capture-screenshots.mjs: isolated sample-course screenshot capture.

## Data Model
One project contains profile, scope, approved flag, completed task checks/reflections, active day, optional app link, reflection drafts and creation time. Data lives in firstship.project.v1 browser storage. Older delivery-mode fields are ignored while preserving learner progress. Both local and published builds use the same course logic.

## Course Guidance
createGuidedScope(profile) proposes one finishable workflow with features, success checks and a later list. createTroubleshootingGuidance(input) converts observed behavior into a focused prompt and repeatable check. React escapes learner text. Completing a task requires all checks and a nonempty reflection. The course does not inspect code or certify learning.

## Failure Modes
Empty or oversized scope fields receive validation. Corrupt storage is preserved until explicit replacement. Storage quota/unavailability produces a visible warning. Missing observed troubleshooting behavior receives a useful error. Only http/https app links are accepted. Local preview blocks dotfiles and non-read requests and exposes no /api endpoints.

## Run and Publish
npm ci; npm run dev → http://localhost:5173. npm run build && npm start previews the built course locally. npm run build:site creates docs/app with relative asset URLs. Commit generated files and push main to publish through GitHub Pages from /docs.

Public repository: https://github.com/zhoumiaosen/FirstShip
Introduction: https://zhoumiaosen.github.io/FirstShip/
Course: https://zhoumiaosen.github.io/FirstShip/app/

## Verification
Node tests cover idea scoping, course guidance, task completion, links, storage, legacy progress and static-server boundaries. Browser tests cover all ten tasks, help retention, scope validation, refresh, export, mobile navigation and the introduction-to-course journey. Published-course tests verify no backend requests. CI runs tests and both builds. Screenshots show the actual current course with an illustrative LeafLog project.

## User Decisions
The user chose a five-day guided course for beginners using their own idea and a separate AI coding tool, approved the product plan, authorized GitHub publication and online access, and explicitly requested removal of optional AI integration and “demo” positioning. The public planning documents remain included for hackathon submission.
