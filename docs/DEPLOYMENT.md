# Run and deploy

## Requirements

- Node 24 LTS recommended (22 is supported by application source; CI uses 24).
- Python 3 for the static preview server.
- Java 21+ for Firebase emulators. Set `KINARC_JAVA_HOME` if needed; the helper detects Homebrew's OpenJDK 21 on this Mac and otherwise respects `JAVA_HOME`/PATH.
- Chromium installed by Playwright for automated browser tests.

## Commands

```sh
npm ci
npm run dev                  # builds, then serves http://localhost:8770
npm run build                # regenerates dist, Firebase bundle and offline cache map
npm start                    # serves existing dist at http://localhost:8765
npm test                     # unit/integration tests
npx playwright install chromium
npm run test:e2e             # complete browser workflows, screenshots and performance artifact
npm run test:rules           # local security tests + Auth/Firestore browser integration
npm run emulators            # keep the demo Firebase emulators running for manual checks
```

For manual emulator checks, serve the app and open `http://localhost:8770/?emulators=1`. The query is accepted only on localhost/127.0.0.1. It connects to `demo-kinarc`; real Firebase data is not used. The emulator provider popup creates test identities. Do not use production credentials in tests.

## GitHub Pages

Push this folder's contents, including hidden `.github`, as the repository root. No source was pushed by the agent. In GitHub **Settings → Pages → Build and deployment**, select **GitHub Actions**. The included `pages.yml` installs Node/Java/Chromium, runs unit/browser/emulator checks, builds and publishes `dist` only after success. `ci.yml` provides PR validation without deployment. Reports/screenshots are uploaded as QA artifacts. The workflow does not deploy Firestore rules or mutate a Firebase project.

All app/module/manifest/asset paths are relative, supporting a repository subpath such as `/KinArc/`. Routes use hashes. Cache names are isolated by deployment path and exercise assets carry content revisions.

On another static host, use build command `npm run build`, output directory `dist`. Guest and device-coach features require no backend or environment secrets. The default Firebase configuration is public web configuration; Google sign-in requires an authorized deployed hostname. Cloud synchronization remains off pending the checklist in DATA_AND_CLOUD.md.

## Local AI

```sh
./start-local.command
# open http://localhost:8766
```

Install Ollama from https://ollama.com/download first if absent. The helper creates a Python environment, downloads Qwen2.5 3B and Piper Lessac when missing, and starts a loopback-only server. First setup needs internet and several GB of disk/RAM for model downloads/runtime. Subsequent generation runs on the Mac. `KINARC_MODEL` can override the backend model when launching `local_server.py` directly after installing that model.

Use **Coach** for conversation or choose **Local generative AI** in practice. A device guide remains available if the service is down. Static GitHub Pages cannot run Python/Ollama/Piper or reach a visitor's Mac localhost. No paid AI provider is configured. Never expose the development AI server publicly or embed private AI keys in the static app.

## Offline and updates

The first visit caches the small app shell. Settings → **Download exercises for offline use** downloads the larger model/voice files with progress. Partial downloads are retained for retry, unchanged assets are reused and stale revisions are cleaned on activation. Download all exercises while online before expecting offline camera use. Google login, cloud sync and generative AI are separate online/local-service capabilities.

The update banner activates a downloaded shell after a workout is finished. Another tab activating an update will not reload an active workout. Existing user data is not stored in service-worker caches and is not deleted by updates.

## Native wrappers

The earlier Capacitor iOS experiment required unavailable Xcode and did not provide a phone-native local AI runtime. Its unused dependencies were removed and the scaffold is omitted from the supported release ZIP. This release supports a browser/PWA; it does not claim to include a verified APK or IPA.
