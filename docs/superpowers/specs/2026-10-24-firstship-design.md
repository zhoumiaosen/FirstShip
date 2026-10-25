---
status: approved
---
# FirstShip product requirements
## Core Journey
Welcome → five-question onboarding → editable scope → journey → task → Codex → learner check → next task → ship summary. Learners can access any day immediately and resume where they left off.
## Features and Behavior
### Onboarding and Scope
Collect idea, audience, main task, experience, daily time. Suggest a small browser app with one core task, at most three features, observable definition of done, and later list. Learner edits and approves; never overwrite existing project on failed generation.
### Journey and Lessons
Five milestones: idea/setup, screen, core action, testing, share. Each task has learn, tailored prompt, expected result, concrete checks, and reflection. Copy handles clipboard failure. Completion requires all checks and a nonempty reflection; all checks are labeled learner-confirmed.
### Recovery
A contextual help panel collects attempt, expected/actual behavior, error and prior attempts. Warn against pasting secrets. Return a likely cause, one next step, a copyable prompt, and verification. Inputs survive AI failures and retry.
### Persistence and Finish
Save project, approved scope, reflections/checks and navigation in browser storage. Storage failure is visible, corrupt data does not crash. Export Markdown summary. Links accept only http/https. Final milestone requires core completion; exporting an unfinished summary is allowed and labeled.
## Look and Feel
Builder choice: warm off-white, forest-green primary, muted mint panels, clean sans typography, generous whitespace and a restrained editorial learning dashboard. Accessible labels, focus, reduced motion and responsive mobile navigation.
## States and Boundaries
No account; browser-local persistence. Service failures are explicit with retry or user-chosen starter guidance. AI suggestions are unverified. No calendar locks, invented progress, or claims to inspect the learner's app.
## Product Decisions
Audience: beginners. Personal idea with scoping help. Separate coding tool. Five-day guided pace. Name FirstShip. All approved in the conversation; implementation details above are builder defaults.
