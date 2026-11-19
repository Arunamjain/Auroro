# GitHub-Backed Portfolio Data & Staged Admin Publishing

Migrate the Aurora portfolio application away from legacy backend auth, hardcoded passcodes, and Supabase/Firebase remnants to a purely GitHub-backed data model powered by a root `data.json` file fetched and updated through the GitHub Contents API. The existing cyber-tactical UI, theme, and terminal-triggered admin experience remain visually unchanged while gaining token-validated GitHub access and staged local editing with single-commit publishing.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All four architectural questions from clarification are locked into this plan below. Review the summary and approve to begin implementation, or request revisions before code changes are made.

- **Initial `data.json` & Bundled Fallback**: Pre-populate both the root `data.json` and the bundled fallback snapshot with your existing portfolio entries (skills, projects, certificates, experiences, and personal info).
- **Admin Entry & Token Validation**: Typing the terminal admin command opens the admin panel directly without any password prompt; inside the panel, entering a GitHub fine-grained Personal Access Token validates repository write access live against the GitHub API before unlocking the editor and storing the token in `sessionStorage` only.
- **Staged Editing & Explicit Save**: Add, edit, and delete actions across all sections update a local staging draft inside the admin panel; clicking the **Save to GitHub** button commits the full updated `data.json` in a single atomic commit with clear success/error feedback.
- **Biography Persistence & Cleanup**: Store `personalInfo` alongside `skills`, `projects`, `certificates`, and `experiences` in `data.json`, while removing all Supabase references, hardcoded passwords, and obsolete local admin/database server routes.

---

## 1. Overview & Core Concept

- **What It Does**: Loads live portfolio content at runtime from the GitHub repository (`Arunamjain/Auroro`) via the GitHub Contents API (`data.json`), decoding UTF-8 base64 content directly in the browser with resilient 404 and offline fallback handling. An authorized owner can open the terminal-command admin dock, authenticate with a fine-grained GitHub token, stage edits across all portfolio sections, and publish a single commit directly back to the repository.
- **Target Audience / Persona**:
  - *Visitors & Recruiters*: View always-up-to-date skills, projects, experience logs, certifications, and bio with instant fallback resilience even if GitHub rate-limits or is unreachable.
  - *Portfolio Owner (Admin)*: Updates portfolio entries directly from the live web app without touching code or maintaining an external database, using a revocable fine-grained GitHub token scoped only to repository contents.
- **Key Value**: Eliminates external database infrastructure, environment secrets, and hardcoded passwords while keeping the portfolio editable from anywhere with full Git commit history for every update.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Public Portfolio Load**: The terminal preloader boots and queries the GitHub Contents API for `data.json`.
     - *Success (200)*: Base64 payload is decoded as UTF-8 JSON and hydrates skills, projects, certificates, experiences, and biography.
     - *Not Found (404)*: Treated as empty arrays for `skills`, `projects`, `certificates`, and `experiences` (preserving safe empty states in each section while keeping core profile/education scaffolding intact).
     - *Network / API Failure*: Seamlessly falls back to the bundled pre-populated snapshot so the site always renders cleanly.
  2. **Entering the Admin Dock via Terminal**: Typing `sudo access --admin` (or supported aliases like `init_auth_session`) in the interactive terminal immediately opens the Root Admin Dock overlay—no legacy password prompt or hidden DOM passcode.
  3. **GitHub Token Gate**: If no token is present in `sessionStorage`, the admin dock shows a focused token prompt explaining the required GitHub fine-grained token permission (*Repository Contents: Read and Write* on `Arunamjain/Auroro`). Submitting validates the token against the GitHub Repository API (`permissions.push === true`). Valid tokens are stored in `sessionStorage` only and unlock the editor; invalid or read-only tokens show a specific error message.
  4. **Staged CRUD Editing**: Inside the unlocked dock, the owner navigates between **Projects**, **Certificates**, **Skills Matrix**, **Professional Experience**, **Biography Narrative**, and **Session / Repository Status**. Every add, edit, or delete updates the local staged draft immediately and increments an unsaved-changes badge in the header/action bar (with an option to discard staged edits).
  5. **Commit & Save to GitHub**: Clicking **Save to GitHub** (with an optional custom commit message, defaulting to a descriptive timestamped summary) fetches the current `data.json` `sha` (skipping `sha` if the file returns `404`), encodes the updated JSON to UTF-8 base64, and sends a `PUT` commit using `Authorization: Bearer <token>`. On success, live portfolio context state updates immediately, staged dirty flags reset, and a confirmation banner displays the commit status. On error (e.g., expired token, `409` SHA conflict, permission denied), an actionable error banner appears while preserving staged edits so no work is lost.
  6. **Session Lock / Logout**: Logging out clears the token from `sessionStorage`, resets staged state, clears terminal history, and locks the admin dock.

- **Visual Identity & Theme *(Preserved Unchanged)***:
  - *Aesthetic Direction*: Sharp, zero-radius tactical cyber-HUD ("Aurora") with subtle CRT scanline overlay, grid texture, and 3D digital globe.
  - *Color Palette & Mood*: Existing CSS variables remain untouched—deep slate background (`--theme-bg: #0B0E14`), translucent dark panels (`--theme-bg-panel`), Aurora cyan accent (`--theme-accent: #06B6D4`), and light titanium slate toggle (`.light-theme` with `#0E7490` accent).
  - *Typography & Hierarchy*: Existing `JetBrains Mono` / `Share Tech Mono` monospace primary typography paired with `Inter` for long-form biography copy.
  - *Component Styling & Layout*: Zero-radius (`rounded-none`) sharp borders, accent rail indicators, and responsive sidebar/drawer layout inside the admin dock are preserved verbatim. Only the admin dock header/footer gains a compact unsaved-changes indicator and **Save to GitHub** action bar matching the existing tactical style.

- **Interactive Feedback & Motion**:
  - Loading spinner states during live GitHub token verification and `GET → PUT` commit publication.
  - Non-blocking inline banners for success (cyan) and error (rose) states inside the admin panel.
  - Clean empty-state fallbacks in Projects, Experience, Skills, and Certificates panes when `data.json` returns `404` (empty arrays) or all items are deleted.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side GitHub Contents API with `sessionStorage`-Only Token**
  - *Chosen Approach*: Communicate directly with `https://api.github.com/repos/Arunamjain/Auroro/contents/data.json` from the browser, keeping the fine-grained PAT strictly in `sessionStorage` for the active browser tab session.
  - *Why*: Zero secrets on the server or in environment variables, works identically across static/serverless hosts, and ensures credentials vanish automatically when the tab closes.
  - *Alternatives Considered*: Server-side proxy with an `.env` GitHub token (rejected because it embeds long-lived credentials in server config and violates the requirement to prompt per session).

- **Decision 2: Live Token Permission Verification on Unlock**
  - *Chosen Approach*: Validate submitted tokens against `GET https://api.github.com/repos/Arunamjain/Auroro` with `Authorization: Bearer <token>` and verify `permissions.push === true` before unlocking the admin panel.
  - *Why*: Catches typos, expired tokens, or read-only tokens upfront instead of failing after the user has spent time drafting edits.
  - *Alternatives Considered*: Deferring validation until Save (rejected per user preference for upfront API verification).

- **Decision 3: Staged Local Drafts with Single-Commit Publishing**
  - *Chosen Approach*: Maintain a local draft copy of portfolio data inside the admin panel so multiple additions, edits, and deletions across tabs are batched into one `GET sha → PUT` GitHub commit when clicking **Save to GitHub**.
  - *Why*: Prevents noisy commit spam, avoids GitHub API rate limits and rapid sequential SHA race conditions, and gives the user a chance to review or discard edits before publishing.
  - *Alternatives Considered*: Committing on every individual form save/delete (rejected per user preference).

- **Decision 4: Canonical Root `data.json` Schema with Clean UI Field Compatibility**
  - *Chosen Approach*: Store the exact root JSON keys `{ "skills", "projects", "certificates", "experiences", "personalInfo" }` while mapping `certificates ↔ certifications` and `experiences ↔ experience` cleanly at the data adapter boundary, preserving all existing item fields (including optional `credentialUrl` on certificates and `stats` on projects).
  - *Why*: Strictly honors the requested `data.json` key names while keeping every public pane and admin form field 100% compatible with zero visual regressions.

- **Decision 5: Removal of Legacy Auth, Passwords, and Supabase/Firebase Remnants**
  - *Chosen Approach*: Remove all Supabase text/code references, hardcoded passcodes (`admin123`, hidden DOM inspect attributes), `ADMIN_PASSWORD`/`ADMIN_JWT_SECRET` env vars, and obsolete Express `/api/admin/*`, `/api/firebase/status`, and `/api/portfolio` routes, keeping only minimal dev/static serving.
  - *Why*: Eliminates dead code and security anti-patterns so the app has a single, transparent GitHub-backed data path.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                   GitHub Repository: Arunamjain/Auroro               │
│                 REST Contents API: /contents/data.json               │
└───────────────▲───────────────────────────────────────▲──────────────┘
                │ Public GET (runtime load)             │ Authenticated GET (sha)
                │ 200: UTF-8 base64 decode              │ + PUT (base64 + message + sha)
                │ 404: empty sections                   │ + GET /repos/... (token check)
                │ Error: bundled fallback               │ Header: Authorization: Bearer
┌───────────────┴───────────────────────────────────────┴──────────────┐
│                     GitHub Portfolio Data Client                     │
│  • UTF-8 safe base64 encode/decode  • Schema normalizer              │
│  • Bundled pre-populated data.json fallback                          │
│  • sessionStorage token accessor (never persisted to disk/code)      │
└───────────────┬───────────────────────────────────────▲──────────────┘
                │ Hydrates & updates                    │ Publishes staged draft
                ▼                                       │ & updates context on 200/201
┌───────────────────────────────┐      ┌────────────────┴──────────────┐
│       Portfolio Context       │◄─────┤       Root Admin Dock         │
│  • Live portfolio state       │      │  • Token Gate (GitHub verify) │
│  • Boot loader progress/logs  │      │  • Local Draft & Dirty State  │
│  • Manual refresh trigger     │      │  • CRUD Forms:                │
└───────┬───────────────────────┘      │    Skills, Projects,          │
        │                              │    Certificates, Experiences, │
        │ Reads live data              │    Biography (personalInfo)   │
        ▼                              │  • Commit Bar (Save/Discard)  │
┌───────────────────────────────┐      └────────────────▲──────────────┘
│    Public Portfolio Views     │                       │ Opens directly on
│  • Hero & Header HUD          │      ┌────────────────┴──────────────┐
│  • Interactive Terminal       ├─────►│  Terminal Admin Command Gate  │
│  • Skills / Projects /        │      │  (`sudo access --admin`)      │
│    Experience / Credentials   │      └───────────────────────────────┘
└───────────────────────────────┘
```

### Data Model & State

- **Root `data.json` Schema**:
  - `skills`: Array of `{ category: string, skills: string[] }`
  - `projects`: Array of `{ id: string, title: string, subtitle: string, tech: string[], highlights: string[], stats?: { label: string, value: string }[] }`
  - `certificates`: Array of `{ name: string, issuer: string, date: string, credentialUrl?: string }`
  - `experiences`: Array of `{ id: string, role: string, company: string, location: string, period: string, highlights: string[] }`
  - `personalInfo`: `{ name, title, subTitle, email, location, githubUrl, linkedinUrl, bio }`
- **Bundled Static Fields**: `education` remains bundled as static academic reference data so the Credentials section continues rendering identically alongside live `certificates`.
- **Runtime State Layers**:
  1. *Portfolio Context State*: Active live portfolio displayed across all public views and terminal commands.
  2. *Admin Draft State*: Cloned working copy inside the admin dock tracking staged mutations (`hasUnsavedChanges`, pending change count) independently of live public views until **Save to GitHub** succeeds.
  3. *Session Token State*: Stored exclusively in `window.sessionStorage` under a dedicated session key; cleared on logout or tab close.

### Interactive Component & State Mapping

- **Startup Data Loader (Context + Terminal Preloader)**:
  - Runs on mount; calls GitHub Contents API with cache-avoidance headers/query to load fresh data.
  - Handles three deterministic branches: `200 OK` (decode base64, parse JSON, normalize into context), `404 Not Found` (set `skills`, `projects`, `certificates`, `experiences` to `[]` while keeping bundled profile defaults), and `Fetch/Parse Failure` (hydrate from bundled `data.json` copy).
- **Interactive Terminal**:
  - Removes `/api/firebase/status` call, Supabase mention in `neofetch`, password prompt mode, and hidden `data-inspect-passcode` DOM element.
  - Reports GitHub data source status on boot (live GitHub, empty 404 repo state, or bundled fallback).
  - Executing `sudo access --admin` (and existing typo-resilient variants / `init_auth_session`) logs a clean handshake message and opens the Admin Dock immediately.
- **Root Admin Dock — Token Gate**:
  - On open, checks `sessionStorage` for a saved token; if present, unlocks directly (with an option to re-verify or rotate token).
  - If absent, displays a masked fine-grained token input and **Verify & Unlock** action.
  - Calls `GET https://api.github.com/repos/Arunamjain/Auroro` with `Authorization: Bearer <token>`; validates HTTP 200 and push permission (`permissions?.push === true`). Surfaces clear feedback for `401` (invalid/expired token), `403`/`404` (missing repo access or `Contents: Read & Write` scope), or network failure.
- **Root Admin Dock — Staged CRUD Editors**:
  - *Projects*: Add, edit, and delete projects with `id`, `title`, `subtitle`, comma-separated `tech`, dynamic `highlights` list, and dynamic `stats` label/value pairs.
  - *Certificates*: Add, edit, and delete certificates with `name`, `issuer`, `date`, and optional `credentialUrl`.
  - *Skills*: Add/delete skill category groups and add/remove individual skill tags within each category.
  - *Experiences*: Add, edit, and delete experience items with `id`, `role`, `company`, `location`, `period`, and dynamic `highlights` list.
  - *Biography (`personalInfo`)*: Edit `name`, `title`, `subTitle`, `email`, `location`, `githubUrl`, `linkedinUrl`, and `bio`, applying changes to the staged draft.
  - *Session / GitHub Settings Tab*: Displays repository target (`Arunamjain/Auroro`), file path (`data.json`), current token session status, reload-from-GitHub action, and session logout. Replaces legacy Firebase seeding/status cards.
  - Every inline confirmation (e.g., deleting an item or discarding staged changes) uses in-panel confirmation UI rather than browser `window.alert`/`window.confirm`/`window.prompt` dialogs so it works smoothly inside iframes.
- **Root Admin Dock — Commit & Save Pipeline**:
  - Persistent action bar shows unsaved status, optional commit message input, **Discard Draft**, and **Save to GitHub** button.
  - On Save:
    1. `GET https://api.github.com/repos/Arunamjain/Auroro/contents/data.json` with `Authorization: Bearer <token>` to obtain current `sha`. If `404`, proceed without `sha` to create the file.
    2. `PUT https://api.github.com/repos/Arunamjain/Auroro/contents/data.json` with `Authorization: Bearer <token>`, `message`, UTF-8 base64 `content`, and `sha` (when present).
    3. On `200`/`201`: Immediately update `PortfolioContext` with the saved data, reset dirty state, and display a success toast with commit confirmation.
    4. On failure (`401`, `403`, `409` conflict, `422`, network error): Keep the staged draft intact and display a clear error banner explaining the cause and next step.
- **Public Section Panes (Projects & Experience Resilience)**:
  - Synchronize selected active project/experience ID via effect whenever the underlying array changes (after async GitHub fetch or admin edits/deletes), and render a styled empty state if a section has zero entries (such as on a `404` response).

### Key Sequences & Integrations

- **GitHub Contents API Read (`GET`)**:
  - Endpoint: `https://api.github.com/repos/Arunamjain/Auroro/contents/data.json`
  - Headers: `Accept: application/vnd.github+json` (plus `Authorization: Bearer <token>` when called from authenticated admin refresh/pre-save SHA lookup).
  - Decoding: Remove line breaks from `content`, convert base64 bytes via `Uint8Array` + `TextDecoder("utf-8")`, then `JSON.parse`.
- **GitHub Contents API Write (`PUT`)**:
  - Step 1: `GET` endpoint with `Authorization: Bearer <token>` and `cache: "no-store"` to read latest `sha` (omit `sha` if `404`).
  - Step 2: `PUT` endpoint with `Authorization: Bearer <token>`, `Content-Type: application/json`, `Accept: application/vnd.github+json`, and JSON body `{ message, content, ...(sha ? { sha } : {}) }` where `content` is encoded via `TextEncoder` → binary string → `btoa`.
- **Clean Server & Environment Posture**:
  - Strip all Supabase code, legacy `/api/admin/*`, `/api/firebase/status`, `/api/portfolio`, `ADMIN_PASSWORD`, and `ADMIN_JWT_SECRET` from server code and `.env.example`, keeping only the Vite/Express static host server on port 3000.
