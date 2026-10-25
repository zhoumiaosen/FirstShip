# FirstShip

**Your idea. Your first app. Five guided days.**

FirstShip coaches beginners as they build their own small browser app with Codex in a separate tool. It turns an ambitious idea into an editable, achievable scope, then provides five days of project-specific tasks, copyable prompts, learner checks, and contextual troubleshooting.

## Run locally

Requires Node.js 22.12+ (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. All days are available immediately; five days is a suggested pace.

Production preview:

```sh
npm run build
npm start
```

The server binds to loopback and accepts localhost hosts only. This is a local hackathon demo, not a public hosted service. Public hosting requires an authenticated access boundary and deployment configuration before enabling a paid API key.

## Optional live AI

Without a key, every core flow works using **Starter guidance**, a deterministic scope suggestion and troubleshooting prompt builder. This is explicitly labeled in the app; it is not a live AI diagnosis.

For live personalized scoping and troubleshooting, copy `.env.example` to `.env` and set `OPENAI_API_KEY` locally. `OPENAI_MODEL` defaults to `gpt-4.1-mini`; select a model available to your API account that supports the Responses API and structured outputs. Restart the server afterward. ChatGPT/Codex access does not supply an API key to this app.

The key stays on the Node server. It is never sent to the browser or included in Git. Do not use a `VITE_` variable for secrets. Live AI uses the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/structured-outputs), sets `store: false`, validates returned data, and reports errors explicitly. A real provider call requires your own API access and may incur charges.

## Learner journey

1. Describe your idea, audience, main task, experience, and time.
2. Review and edit the reduced scope. Save extra ideas for later.
3. Follow project-specific task cards in any day; copy prompts into Codex.
4. Return, try each check, and record what happened.
5. Use “I'm stuck” to turn an error into a focused investigation prompt.
6. Complete the core tasks, add a safe app/demo link, and export your project summary.

Milestones are learner-confirmed. FirstShip does not inspect your local code, run your app, or automatically grade your work.

## Data and privacy

One project is saved in this browser's local storage, including idea, plan, reflections, and lesson progress. It is not synced between devices. Export a summary before clearing browser data. Storage failures are shown rather than reported as saved.

Scoping and help submissions go to the local server. When live AI is enabled, those submitted fields are sent to OpenAI. Remove passwords, API keys, personal data, and private code before submitting. Starter guidance does not call an external AI provider. Do not use sensitive or regulated information in this prototype.

## Verification

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Node tests cover scope variety, completion gates, persistence, URL handling, AI response validation, failures, request limits, and server boundaries. Browser tests cover the learner journey and small-screen navigation. GitHub Actions runs the same checks.

## Source map

- `src/App.jsx`: welcome, onboarding, plan, journey, lessons, help, and summary.
- `src/styles.css`: responsive visual system.
- `src/lib/domain.js`: personalized curriculum, scope, completion, and export.
- `src/lib/storage.js`: browser-local persistence and recovery.
- `server/coach.js`: input validation, starter guidance, optional live AI.
- `server/index.js`: local HTTP server and API boundaries.
- `devpost/`: scope, product requirements, technical specification, build checklist.

## Hackathon workflow and attribution

Built from a new empty project folder during the hackathon, using the [Devpost Learn Skill Pack](https://github.com/challengepost/learn-ai-basics). Its six installed skills live under `.agents/skills/` and are MIT licensed; see `.agents/skills/DEVPOST-LICENSE`. Planning documents distill decisions made with the learner before implementation. Builder-selected technical defaults are labeled in the specification. Original curriculum material in the app is informed by the linked official guides in the app's resources.

Dependencies include React, Vite, and Lucide icons. No pre-existing application code was imported. AI coding assistants were used for implementation and verification. A public source repository and a separately recorded, publicly accessible demo video are required for submission; this repository does not constitute a completed hackathon submission.
