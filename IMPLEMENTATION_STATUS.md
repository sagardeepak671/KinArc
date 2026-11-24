# KinArc implementation status

Updated 2026-11-23. This is an implemented web/PWA release candidate, not a claim of clinical validation or a certified native application.

## Completed implementation phases

- [x] Audit: baseline 16 passing tests; original source, model assets, coaching, auth, storage, reports and workflow reviewed.
- [x] Core foundations: source/build separation, centralized exercises, explicit multi-set workout states, configurable ranges, interruption handling and transaction-backed IndexedDB migration.
- [x] UI and onboarding: shared visual tokens, desktop sidebar/mobile tabs, three-step guest/Google onboarding, persistent preferences, accessible dialogs/toasts and complete settings.
- [x] Exercise/workout/video: detail pages, combined filters/favorites, narrated/controllable trials, camera positioning/countdown/rest/pause, timestamp-stepped uploaded video and saved detail timelines.
- [x] Routines: named/duplicated/editable/reordered plans, weekdays, sets/rest/side configuration, calendar reminder exports, exact-item credit, skip/next and safe interrupted-run configuration.
- [x] Accounts and storage: identity gate, guest/UID/profile separation, multi-tab updates/sign-out handling, explicit guest transfer, profile management, local data removal and validated backups.
- [x] Cloud implementation: granular records, owner-only dedicated rules, opt-in listening/sync, revisions/conflicts, tombstones, retries/status and demo-emulator infrastructure. Production remains disabled.
- [x] Coach/analytics: device feedback and educational guide; optional local Ollama/Piper chat/health/cancellation/fallback; consented summaries/microphone; real-data all-time reports, calendar, milestones, angle tables, search, pagination and exports.
- [x] PWA/accessibility/performance: lazy pose loading, optional offline exercise downloads, content revisions and per-subpath caches, no active-workout reload, touch/focus/captions/reduced motion and responsive layouts.
- [x] Deployment preparation: static GitHub Pages compatibility, test-before-deploy/PR workflows, optional local AI instructions, architecture/migration/security/troubleshooting documentation and notices.
- [x] Final consolidated release validation, syntax/whitespace review, screenshots and release report.

## Final verification

- Node 24.22.3 unit/integration suite: **43 passed, 0 failed**.
- Chromium end-to-end suite: **18 passed, 0 failed**, including responsive layouts at 320/390/768/1024/1440 px, offline use, backups, recovery, video pause, routines and real bundled MediaPipe initialization.
- Firestore emulator security suite: **2 passed, 0 failed** (multiple owner/non-owner/schema checks within each case).
- Auth/Firestore emulator browser suite: **2 passed, 0 failed**, covering identity/cache isolation and opt-in cross-device records.
- Installed local Ollama/Piper API suite: **7 passed, 0 failed**, covering health, canonical camera instructions, grounded corrective WAV speech, symptom referral, invalid role/size and bad Origin.
- Production build, first-party JavaScript/Python parsing, shell parsing and `git diff --check`: pass.
- Final dependency audit: **0 known vulnerabilities**.
- Local Chromium navigation sample: approximately 232 ms observed app-ready time and 828,414 transferred resource bytes. This is a local fixture run, not a phone/network benchmark. Heavy pose files are not requested before camera/video use or explicit offline download.
- Screenshots: desktop and phone in light/dark, plus practice/settings/progress/coach screens in both themes; see `docs/screenshots`.
- No production service was deployed, no unrelated Firebase resource was modified, and no remote Git repository was pushed.

## Architectural decisions

- Retain maintainable vanilla modules rather than rewriting into a large framework. `src` and `public` generate `dist`.
- Use IndexedDB individual records plus a compatibility projection so original flows remain connected. Preserve legacy localStorage until an explicit local-erasure action.
- Treat generated live language as encouragement around authoritative supported corrections. Never rely on a small LLM to independently diagnose form.
- Keep shared Firebase resources untouched. Only demo-emulator operations are automatic. A dedicated KinArc production project is preferable.
- Keep the PWA as the supported application; remove unused native dependencies and exclude the incomplete native scaffold from packaging.

## Explicit external verification / limits

- [ ] Real Google consent on the final deployed hostname, which must be authorized in Firebase.
- [ ] Merge/audit actual production rules (including unrelated broad matches), verify region/quotas and enable `cloudEnabled` only after approval/configuration checks. No production history has been uploaded.
- [ ] Physical Android/iOS camera positioning, different devices, codecs and installed speech voices. Synthetic tests and a no-person model check do not validate clinical accuracy or every device.
- No new exercise was labelled “tracked” without a supported measurement path. The ten existing exercises remain; expanding beyond them needs additional geometry/device validation.
- Reminders are calendar exports, not background push notifications. No paid/hosted AI provider or verified APK/IPA is included.
- Large histories beyond tested fixtures, cross-browser engines and formal WCAG certification remain unverified. Local IndexedDB data is not encrypted; shared devices need separate browser/device accounts.
- Client cancellation prevents stale playback; an already-running local Ollama generation can continue until its bounded timeout.

## Product design and UX overhaul — 24 November 2026

Implemented the public website/app separation, shared brand system, ten original exercise visuals, redesigned core screens, mobile workout ordering, grouped settings, accessible keyboard entry and observed angle-range charts. Production build, 43 unit tests, 24 browser tests and four emulator checks passed; 22 automated accessibility scans reported no violations. See [docs/DESIGN_OVERHAUL.md](docs/DESIGN_OVERHAUL.md) for final evidence and external verification limits.
