# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build process or dependencies — this is a static vanilla JS/HTML/CSS project.

- **Open directly**: Double-click `index.html` in a browser
- **Serve via HTTP** (avoids some `file://` quirks): `python3 -m http.server 8000` or `npx http-server`

## Architecture

MathQuest is a 6th-grade math educational platform (Uzbek language) implemented as a single-file-entry SPA with no framework.

### Entry Point & Auth

`index.html` loads all JS/CSS files. On load, `auth.js` checks `localStorage['mq_session']` and renders the appropriate panel. Two roles exist: **student** and **admin**.

- Admin password is hardcoded in `auth.js`: `ADMIN_PASSWORD = "admin2026"`
- Sessions are stored as JSON: `{ role, name, id }`

### Data Model & Storage

All persistence is via localStorage. There is no backend.

| Key | Owner | Contents |
|-----|-------|----------|
| `mq_session` | auth | Current session `{ role, name, id }` |
| `mq_admin_v2` | admin.js | Master data: `{ topics[], materials{} }` |
| `mq_student_v2_${id}` | student.js | Per-student progress, XP, streak |

**Topic structure** (inside `mq_admin_v2.topics`):
```js
{
  id: string,          // lowercase, no spaces
  title: string,
  icon: string,        // emoji
  theory: string,      // HTML content
  quizzes: [{ type: 'mcq'|'fib', q, options?, correct, difficulty }],
  videos: [{ title, url, xp }]
}
```

Materials are stored as metadata only (`{ name, type: 'pdf'|'doc'|'ppt', url }`). There is no actual file upload — files use placeholder URLs.

### JS Modules (all IIFEs, no ES modules)

- **`auth.js`** — Login/logout, role-based panel rendering, session management
- **`student.js`** — Student panel: dashboard, topics list, quiz flow, videos, leaderboard, profile. State lives in a closure `state` object. Navigation is route-based via a `navigate(route)` function.
- **`admin.js`** — Admin panel: full CRUD for topics/quizzes/videos/materials, data export to GitHub (JSON), deep scan recovery for legacy localStorage keys.
- **`content.js`** — Default topic definitions (fallback if no admin data). Currently minimal.
- **`firebase-config.js`** — Legacy Firebase config (Firebase was removed). This file is still loaded but unused.

### Quiz & Progression Logic

- Scoring: **10 XP per correct answer**
- Level formula: `level = Math.floor(XP / 100) + 1`
- Topic unlock threshold: **70% score** unlocks the next topic
- Question types: `mcq` (multiple choice with `options[]` array) and `fib` (fill-in-the-blank with string `correct`)

### Styling

- `src/css/main.css` — Core styles with CSS custom properties in `:root`
- `src/css/dashboard.css` — Dashboard-specific overrides
- Dark theme: toggled via `body.dark-theme` class, all colors defined as CSS variables
- Responsive: mobile sidebar toggle via `#mobile-menu-btn`

### Data Export / Recovery

- **Export**: `exportToGithub()` in `admin.js` serializes `mq_admin_v2` to JSON for manual GitHub backup
- **Recovery**: Deep scan of all localStorage keys (legacy key patterns) for data migration
