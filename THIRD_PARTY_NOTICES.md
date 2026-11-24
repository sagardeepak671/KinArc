# Third-party components

- Google MediaPipe Pose JavaScript/WASM/model assets in `public/pose*`: Google MediaPipe, Apache-2.0 upstream project. Source: https://github.com/google-ai-edge/mediapipe and its LICENSE. The existing project supplied these assets; this upgrade preserves them.
- Firebase JavaScript SDK: Apache-2.0, https://github.com/firebase/firebase-js-sdk. Built locally from the version pinned in package-lock.json; its bundled license comments are retained.
- Piper local text-to-speech: GPL runtime; voice metadata/licensing accompanies downloaded Lessac model files. Runtime and model are optional, installed separately, and excluded from the release ZIP. Review distribution obligations before bundling either.
- Ollama and downloaded model: separately installed. Model terms are provided by its publisher. No LLM model weights are included in this project archive.
- Clay illustrations, SVG app icon and procedural character rendering use the project's own code. No stock photos or external copyrighted character assets were added.

No distribution license for the application's own source is selected by this upgrade (`private: true`, `UNLICENSED`). Choose an appropriate license before publishing source for reuse.

## Design assets added 24 November 2026

KinArc locally bundles Manrope under the SIL Open Font License (`public/licenses/Manrope-OFL.txt`) and two contextual Pexels photographs under the [Pexels License](https://www.pexels.com/license/). Sources, modifications and usage are documented in [docs/design/ASSETS.md](docs/design/ASSETS.md). The people pictured do not endorse KinArc. Exercise artwork and the updated arc-and-joint mark are original project assets.
