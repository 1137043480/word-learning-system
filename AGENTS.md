# Repository Guidelines

## Project Structure & Module Organization
The Next.js frontend lives in `pages/`, with each learning mode exposed as a dedicated route (for example `pages/word-learning.tsx` and `pages/time-tracking-demo.tsx`). Reusable UI primitives based on shadcn are in `components/ui/`, while shared TypeScript helpers sit in `src/lib/`. Python services fuel adaptive logic through Flask apps such as `app_phase2.py` and data loaders like `simple_test_data.py`; keep database fixtures in the SQLite files `words.db` and `words_extended.db`. Shell helpers (`start_frontend.sh`, `start_system.sh`) bundle common startup flows.

## Build, Test, and Development Commands
Run `npm install` once to pull web dependencies. Use `npm run dev` for the local Next.js server at `http://localhost:3000`, `npm run build` to create the production bundle, and `npm run start` to serve the compiled output. The adaptive API launches with `python app_phase2.py` (default port `5004`); `bash start_system.sh` prepares seed data and starts the API plus health checks. Keep both the frontend and API running when iterating on integrated features.

## Coding Style & Naming Conventions
Author React components as typed functional components with 2-space indentation and descriptive PascalCase file names (`LearningDashboard.tsx`). Group Tailwind utility classes by layout→spacing→color for readability. Within `components/ui/`, extend existing primitives before introducing new ones. Python modules follow PEP 8: 4-space indentation, snake_case functions, and uppercase constants for configuration. Prefer using `src/lib/cn` for className merging instead of ad hoc helpers. Run `npx eslint .` before sending changes to catch style regressions.

## Testing Guidelines
There is no formal test runner yet; prioritize targeted scripts and manual verification. After backend changes, execute `node test_time_tracking.js` to exercise the session APIs and review console output. For new endpoints, add equivalent fetch-based checks or `curl` examples in the script header. Validate UI updates by walking through the relevant route and inspecting browser console warnings.

## Commit & Pull Request Guidelines
The repository was freshly initialized, so establish clear history using Conventional Commits (e.g., `feat: add spaced repetition dashboard`). Scope commits narrowly around a single concern and include concise English descriptions. Pull requests should link issues when available, list the commands or scripts executed (`npm run dev`, `node test_time_tracking.js`), and attach screenshots or recordings when UX changes affect the student-facing flows. Tag reviewers who own the touched module (frontend vs. adaptive engine) to keep feedback efficient.
