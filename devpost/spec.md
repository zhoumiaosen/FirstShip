---
status: implementation-defaults
---
# FirstShip technical specification
Implements the approved PRD. Technical defaults chosen by the builder under the user's instruction to start; these were not separately selected by the user.
## Architecture
React + Vite client; Node HTTP server serves Vite middleware during development and dist in production. No database. Server-only OpenAI Responses API via fetch, OPENAI_API_KEY and configurable OPENAI_MODEL. Missing key selects clearly labeled local guidance. API errors return errors, not silent success.
## Components and File Structure
src/App.jsx: journey/screens; src/styles.css: responsive design; src/lib/domain.js: pure scope, lesson, progress, export functions; src/lib/storage.js: versioned persistence; server/coach.js: validation and AI boundary; server/index.js: HTTP/static serving; tests: Node domain/API and Playwright browser flows.
## Data Model
Project {id, profile:{idea,audience,goal,experience,time}, scope:{title,description,audience,coreTask,features:string[],done:string[],later:string[]}, approved:boolean, completed:Record<taskId,{checks:boolean[],reflection:string}>, activeDay:number, appUrl:string, reflections:Record<string,string>, createdAt:string}. Versioned storage envelope. Only completion function may add valid completed task records.
## API Contract
GET /api/health → {ok:true,aiAvailable:boolean}. POST /api/coach {action:'scope'|'help',profile,scope?,task?,problem?} → {mode:'ai'|'guided',result:Scope|Help}. Help {explanation,nextStep,prompt,check}. Validate length/types, schema-check response, timeout upstream. Never log request content or credentials. Limit body to 24 KB; same-origin POST, bounded concurrency/rate, no CORS. Structured JSON schema for AI responses, store:false.
## Failure Modes
Bad input: 400. Oversized body: 413. Provider timeout: 504; provider invalid/unavailable: 502. No key: deterministic guidance labeled guided. Browser storage unavailable: retain in-memory work and show warning. Corrupt saved progress: recovery warning without overwriting original value. HTTP links only; React escapes text.
## Where It Runs and How Someone Tries It
npm install; npm run dev → http://localhost:5173. Production: npm run build && npm start. Optional .env server key, never VITE_ secrets. Local demo is sufficient for hackathon recording. GitHub publication explicitly authorized.
## Verification
Node tests: scoping variety, completion gates, malformed storage, summary links, provider schema/error/rate handling. Browser tests: complete onboarding, edit scope, tasks/checks/reflection, help, reload, responsive navigation, export. Build and inspect browser screenshots.

## Public Repository
https://github.com/zhoumiaosen/FirstShip — public, main branch. GitHub Actions runs core tests, production build and browser checks on push.

## Public Browser Demo
The user requested direct online access from the introduction website. `npm run build:demo` builds the same React app in Vite `online-demo` mode to `docs/app/` with relative asset URLs. GitHub Pages serves it at https://zhoumiaosen.github.io/FirstShip/app/.

In this mode, `src/lib/coach-client.js` uses shared pure starter guidance in `src/lib/guidance.js`. Planning and help stay in the browser; no `/api` or AI provider requests are made. The online demo is labeled starter guidance, with local storage, all ten tasks, checks, help, and summary export. The Node build retains server-backed optional live AI and its existing validation. Public live AI hosting is not configured.

Verification adds three client tests and a browser journey starting at the introduction CTA, covering scoping, help, ten tasks, refresh, download, mobile layout and no backend requests. CI builds and tests both variants.
