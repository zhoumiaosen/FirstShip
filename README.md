# FirstShip

**Your idea. Your first app. Five guided days.**

FirstShip coaches beginners as they build their own small browser app with Codex in a separate tool. It turns an ambitious idea into an editable, achievable scope, then provides five days of project-specific tasks, copyable prompts, learner checks, and contextual troubleshooting.

[**Try FirstShip online**](https://zhoumiaosen.github.io/FirstShip/app/) · [Introduction website](https://zhoumiaosen.github.io/FirstShip/) · [Run locally](#run-locally) · [Screenshots](#screenshots)

The public app includes the complete learner journey with **Starter guidance**: idea scoping, ten tasks, contextual troubleshooting, learner-confirmed checks, saved progress, and summary exports. No installation, account, or AI API key is needed. Building your own app still happens in a separate coding tool such as Codex; access to that tool is separate. Live AI is optional in the local server version and is not active in the public app.

![FirstShip dashboard showing a personalized five-day learning journey for the sample LeafLog project](docs/screenshots/dashboard.png)

## What you can do

- Bring your own idea and turn it into an editable, achievable first version.
- Follow ten practical tasks across five guided days, with prompts to take to Codex.
- Check the result yourself, record what happened, and keep your progress across visits.
- Get a focused next step when you are stuck, then return to building.
- Download a summary of your plan, completed tasks, and reflections.

## Screenshots

These are real app captures using **LeafLog**, an illustrative plant-watering project. They show starter guidance; no learner data or live AI conversation is included.

<details>
<summary><strong>Turn your own idea into a small, editable plan</strong></summary>

![Editable LeafLog scope with one core workflow, build-now features, and a later list](docs/screenshots/scope.png)

</details>

<details>
<summary><strong>Learn with a task, a prompt, and a clear check</strong></summary>

![FirstShip day-three lesson with a personalized Codex prompt and expected result](docs/screenshots/lesson.png)

</details>

<details>
<summary><strong>Find your next step when something goes wrong</strong></summary>

![FirstShip coaching panel turning a sample watering-history problem into an investigation prompt](docs/screenshots/coaching.png)

</details>

<details>
<summary><strong>A learning space that works on a small screen</strong></summary>

<img src="docs/screenshots/mobile.png" alt="FirstShip lesson on a mobile screen with accessible day navigation and a personalized prompt" width="390" />

</details>

<details>
<summary><strong>A welcoming starting point for first-time builders</strong></summary>

![FirstShip welcome page introducing the five-day guided experience](docs/screenshots/welcome.png)

</details>

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

The Node server binds to loopback and accepts localhost hosts only. The public GitHub Pages app is a separate, browser-only build using starter guidance; it does not expose this server or a paid API key. Hosting the Node server publicly with live AI would require an authenticated access boundary and deployment configuration.

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

In the public app, starter scoping and troubleshooting run in the browser without sending your answers to an AI provider. In the local server version, scoping and help submissions go to the local server; when live AI is enabled, those submitted fields are sent to OpenAI. Remove passwords, API keys, personal data, and private code before submitting to an AI service or coding tool. Do not use sensitive or regulated information in this prototype.

## Verification

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run build:demo
npm run test:demo
```

Node tests cover scope variety, completion gates, persistence, URL handling, AI response validation, failures, request limits, and server boundaries. Browser tests cover the learner journey and small-screen navigation. The public-demo test opens the introduction link, completes all ten tasks, uses help, reloads, exports, and verifies that no backend requests are made. GitHub Actions runs both versions.

## Online app, introduction website, and screenshots

The introduction site lives in `docs/index.html` with its own stylesheet. It is a standalone static website: no build step, account, API key, or JavaScript is needed to view it. Its **Try FirstShip** links open the working browser app at `docs/app/`. GitHub Pages publishes the repository's `main` branch from `/docs`.

Rebuild the public app after application changes:

```sh
npm run build:demo
```

This creates the browser-only app in `docs/app/`, using local starter guidance and browser-local progress. It includes no server or live AI credentials. Commit the generated files when publishing an update.

Preview the website locally:

```sh
python3 -m http.server 4173 --directory docs
```

Then open http://localhost:4173 for the introduction page, or http://localhost:4173/app/ to try the browser app. Rebuild with `npm run build:demo` first if `docs/app/` is missing or out of date. The optional local server setup above enables live AI with your own key.

To refresh the screenshots, start FirstShip in one terminal, then run this in another:

```sh
npm run screenshots
```

The capture script opens an isolated sample project and uses the actual starter-guidance code. It does not change your saved project or call a paid AI provider. `SCREENSHOT_BASE_URL` can point to a different local preview address.

## Source map

- `src/App.jsx`: welcome, onboarding, plan, journey, lessons, help, and summary.
- `src/styles.css`: responsive visual system.
- `src/lib/domain.js`: personalized curriculum, scope, completion, and export.
- `src/lib/storage.js`: browser-local persistence and recovery.
- `src/lib/guidance.js`: shared starter guidance used without a live AI provider.
- `src/lib/coach-client.js`: coaching access for the online demo and local server modes.
- `server/coach.js`: input validation, starter guidance, optional live AI.
- `server/index.js`: local HTTP server and API boundaries.
- `devpost/`: scope, product requirements, technical specification, build checklist.
- `docs/index.html`, `docs/site.css`: static introduction website.
- `docs/screenshots/`: real sample-project screenshots used by the website and README.
- `docs/app/`: generated, browser-only public app (`npm run build:demo`).
- `scripts/capture-screenshots.mjs`: reproducible, isolated screenshot capture.

## Hackathon workflow and attribution

Built from a new empty project folder during the hackathon, using the [Devpost Learn Skill Pack](https://github.com/challengepost/learn-ai-basics). Its six installed skills live under `.agents/skills/` and are MIT licensed; see `.agents/skills/DEVPOST-LICENSE`. Planning documents distill decisions made with the learner before implementation. Builder-selected technical defaults are labeled in the specification. Original curriculum material in the app is informed by the linked official guides in the app's resources.

Dependencies include React, Vite, and Lucide icons. No pre-existing application code was imported. AI coding assistants were used for implementation and verification. A public source repository and a separately recorded, publicly accessible demo video are required for submission; this repository does not constitute a completed hackathon submission.
