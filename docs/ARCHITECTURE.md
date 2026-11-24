# Architecture

## Runtime and build

`src/` contains editable, browser-native ES modules, HTML and styles. `public/` holds existing MediaPipe assets, voice files, icons and textures. `scripts/build.mjs` copies these into generated `dist/`, bundles Firebase with esbuild, and generates revisioned service-worker assets. No React rewrite or paid dependency was introduced. The old Capacitor scaffold is not a supported runtime and is omitted from the release archive.

## Startup and identity

`bootstrap.mjs` holds the UI behind a status screen. `auth-service.mjs` resolves Firebase identity first. A local UID hint is never trusted. Only then does `initializeStore` open the verified UID's IndexedDB scope, or the guest scope. Account changes hide the UI and reload through this gate; sign-out broadcasts to other open tabs. Browser-session auth persistence avoids treating a cached local UID as a login.

Google's real provider consent flow remains external. The browser tests use Firebase's official Auth emulator credential flow, not a fake application login flag. `?emulators=1` is accepted only on localhost/127.0.0.1 and uses `demo-kinarc`, never production.

## Data

`database.mjs` uses IndexedDB database `kinarc-v2`, version 1, with a scope-indexed record store and migration metadata. Profiles, sessions, routines and routine completions are individual records. A synchronous in-memory projection preserves the existing module interfaces; writes are queued as transactions and important user actions await `flush`. Tombstones preserve deletion intent. BroadcastChannel refreshes same-scope tabs. The original localStorage is never removed during migration.

Imports validate before one replacement transaction. Failed transactions retain the old workspace. The version-1 JSON backup envelope remains supported. A restore disables cloud sync pending renewed opt-in.

## Workouts and tracking

`exercises.mjs` centralizes the ten movement definitions, camera views, joint indices, ranges and instructions. `tracker.mjs` measures image-pixel angles, checks visibility and segment lengths, smooths using elapsed time and requires sustained endpoints. Missing observations and discontinuous/duplicate timestamps reset partial cycles. Squats and hinges validate a second joint. Sudden translated views reset a partial cycle. These safeguards do not prove correct form or medical accuracy.

`workout.mjs` owns positioning → countdown → active → rest → next set → complete, with explicit pause/resume semantics. `app.js` owns media lifecycle and connects the tracker, coach, state machine and persistence. Only one pose inference runs at a time. The pose script/model load on demand. Video analysis seeks sequentially in 100 ms video-time steps rather than counting based on wall-clock inference speed. Saved timelines are bounded.

`plan.mjs` manages named, scheduled routines and movement settings. A saved session credits an exact item only when source, item ID, exercise, side, reps and sets meet its target. Rehearsals never credit tracked completion. Interrupted routines require deliberate reconfiguration and never restart a camera automatically.

## Coaching

Device speech uses supported correction rules, captions and milestones. Local generative coaching uses a server-only Ollama adapter plus optional Piper speech. Live detected corrections retain their authoritative wording; generated encouragement cannot rewrite the adjustment. Chat is a separate general educational workflow. Context summaries require an explicit checkbox and omit camera footage. The provider boundary can support another backend without exposing private keys in the static client. No hosted/paid provider is configured.

## Cloud

`sync.mjs` synchronizes per-record documents at `kinarcV2/{uid}/records/{recordId}` only after opt-in. Revisions/base revisions detect conflicts; the user chooses local or cloud. Deletions are tombstones. A Firestore listener receives changed records; local writes are debounced, and uploads use transactions to avoid overwriting a changed head. It remains disabled in production until the dedicated rules are merged, broader shared rules are audited and real-domain configuration is verified.

## UI and accessibility

Vanilla page modules share tokens, tactile controls, custom SVG navigation icons, dialogs and toast utilities. Desktop uses a sidebar; phones use bottom tabs with secondary destinations in Settings. Settings, onboarding, exercise details, chat and progress are implemented in `product.mjs` with smaller domain modules. Charts have text summaries or measurement tables. Speech always has captions. Reduced motion disables decorative animation, while instructional movement remains controllable.
