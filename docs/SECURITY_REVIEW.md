# Security and reliability review

## Implemented protections

- Firebase identity initializes before opening account-local data. Local UID hints cannot authenticate a user. Browser-session identity changes gate and reload the UI; cross-tab sign-out hides cached account views.
- Scoped IndexedDB records prevent accidental mixing of guests/accounts/profiles. Imports validate types, ranges, duplicate IDs and maximum sizes before an atomic replacement. Original legacy data remains recoverable until explicit workspace erasure.
- No user text is inserted with `innerHTML`. Names, chat, routine labels and session notes render through `textContent`. CSV cells quote all values and neutralize leading formula characters (including whitespace).
- Cloud sync is off in production by default, opt-in when configured, per-record and owner-only under dedicated KinArc rules. Revisions, transactions, tombstones and conflict choices avoid silent overwrites. Deleted record bodies are cleared; local Undo holds only the deleted entry until the UI action is replaced.
- Profile removal is separate from shared Firebase Auth user deletion. The shared project’s existing resources/rules were not modified. Other app data is never included in KinArc deletion paths.
- Camera/video frames stay local. Cloud sync and chat context have explicit consent controls. Voice input explains the browser provider before requesting the microphone. Browser device voices may be network-backed depending on OS settings.
- The local Python AI server binds only to 127.0.0.1, checks Host/Origin on POST, limits requests to 40 KB and one model request at a time, uses fixed Ollama URLs and bounded timeouts, and exposes no private credentials. It serves only `dist` static files. Request content is not logged.
- Generated live text cannot rewrite a detected correction: the measured rule’s action remains fixed, with generated encouragement appended. Chat is educational and declines explicit symptom/diagnosis requests. This is not a guarantee against all LLM mistakes; authoritative instructions remain in exercise details.
- Pose inference is sequential and resources close after exits/completion. Video analysis validates file size, browser codec support and duration, and uses video-time stepping. Device permission/model failures restore setup controls.
- Service workers cache public app assets only, exclude API routes, namespace caches by deployment subpath and fingerprint exercise assets. Activation during a workout never triggers an automatic reload.

## Evidence

See IMPLEMENTATION_STATUS.md and the release report for final counts. Auth and Firestore were tested with local demo-project emulators, including owner/cross-owner/unauthenticated access, malformed writes and shared-app paths. Browser tests cover account isolation, opt-in granular sync, migration/restore, offline use, media fixtures, viewports and errors. The dependency audit is run before packaging.

## Boundaries and remaining verification

- Real Google consent, authorized deployment domains, the shared project’s complete existing wildcard rules and real-device camera/speech behaviour require external checks. Production cloud access is deliberately disabled until those checks.
- The application is not encrypted local storage and does not defend against another person with access to the same browser profile/devtools. Use separate device/browser accounts for privacy.
- The shipped application is an educational movement app, without clinical validation. 2D tracking cannot verify grip, spinal alignment, load, balance or all incorrect movements.
- An already-running Ollama request may finish after client cancellation; the frontend discards it and never plays stale speech. Backend execution is bounded by its timeout and single-request lock.
- IndexedDB uses an in-memory compatibility projection of the active workspace. Extremely large histories beyond the tested fixtures need additional scale testing. History rendering is paginated; CSV/backup exports include all selected records.
- Broad shared Firebase rules can grant access despite a narrower rule. Audit and merge; never blindly deploy this project's rules over a shared application.
