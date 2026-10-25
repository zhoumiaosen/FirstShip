---
status: implementation-authorized
mode: fast
---
# Build checklist
User approved the detailed design and requested complete implementation. Routine technical defaults and build order proceed under that authorization, overriding repeated approval prompts in skill guidance.
## Slices
- [ ] **1. An idea becomes a saved achievable plan**
  Becomes usable: onboarding, scope edit and journey.
  Why now: proves personalized scoping kernel early.
  PRD ref: Onboarding and Scope
  Spec ref: Data Model
  Build: domain + onboarding + persistence.
  Verify (mechanical): domain tests, build, browser onboarding/reload.
  Learner check: enter an idea, edit scope, refresh and see it retained.
  Commit: feat: add personalized project journey
- [ ] **2. Learn, get unstuck, and finish**
  Becomes usable: task/check/reflection loop, help, final export.
  Why now: completes the core learner experience.
  PRD ref: Journey and Lessons; Recovery; Persistence and Finish
  Spec ref: API Contract; Failure Modes
  Build: five-day curriculum, optional AI, explicit offline guidance, completion gates.
  Verify (mechanical): Node tests, browser journey and production build.
  Learner check: copy a task, try help, confirm checks and export.
  Commit: feat: complete coaching and first-app handoff
## Hands-on Checkpoints
- [ ] User tries the completed local preview; do not claim this happened before feedback.
## Final Review
- [ ] Agent verification and independent review.
- [ ] User confirms ready after trying it.
## Code Tour and App Map
- [ ] Provide concise source map and reusable verification takeaway.
## Revisions
- Technical defaults selected by builder, not attributed to user. No extra approval gates because user explicitly requested implementation.
