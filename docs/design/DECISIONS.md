# KinArc product design decisions

Date: 24 November 2026. This is a local implementation; no production deployment or Firebase configuration was changed.

## Audit and constraints

The starting app used textured rounded surfaces, a serif heading on nearly every component, dashed labels and similar card treatments for workouts, settings and data. Discovery and the working dashboard shared one screen. The camera action came after a long setup form on phones. The existing source already contained real tracking, local profiles, account separation, routines, history, optional AI and offline support. Those modules and storage formats were retained.

The latest attachment contained the written brief, without the additional reference image files it mentioned. The named reference products were inspected through their official public pages: [YourTrainer](https://www.yourtrainer.in/), [Studio FIT India](https://studiofitindia.com/), [Habuild](https://habuild.in/) and [BODi](https://www.bodi.com/). The transferable ideas were clear entry actions, purposeful movement imagery, concise category discovery and separation of explanatory content from task controls. No reference photography, logos, copy, metrics or testimonials were reused.

## Three directions considered

| Direction | Public composition | App composition | Strength | Cost |
| --- | --- | --- | --- | --- |
| Editorial movement (selected) | Large type beside real home-exercise photography; a ruled workflow and curated exercise row | Dark navigation, compact activity rail, contextual starting action and image-led discovery | Clear purpose without dressing the app as a marketing page; supports dense history/settings | Requires separate public and app layouts |
| Camera first | Wide dark tracking stage as the hero, setup steps underneath | A permanently open tracking workspace with tool drawers | Makes computer vision immediately visible | Overemphasizes the camera before permission/setup and makes routines/history feel secondary |
| Catalog first | Exercise collection above the fold, compact product introduction | Exercise search as the home screen, activity in a secondary tab | Fast for people who know their exercise | Weak first-time product explanation; duplicates library and home responsibilities |

Selection criteria: first-visit clarity, few steps to a workout, returning-user usefulness, truthful representation of capabilities, responsive composition and suitability for data-heavy screens. The editorial direction best separates these jobs. `directions.svg` records the three layout studies.

## Shared system

- Locally hosted Manrope variable font; strong sans-serif display hierarchy and tabular workout numbers.
- Warm white `#f5f5f1`, white surfaces, deep green charcoal `#1e2b25`, coral/terracotta action `#b9472b`, green data accent `#3f7358`.
- Dark mode has independently defined surface, border, text and accent colors.
- 6–12px radii, restrained borders, no grain, pillow shadows, dashed decorative labels or floating objects.
- Shared form, button, focus, dialog, data-row, chart, navigation and exercise-image rules. A small CSS system, not a new component framework.
- Sidebar on larger screens; five primary phone destinations. Planning, profiles, help, progress and coach also have real Settings shortcuts.

## Information architecture

- First visit `/`: public product introduction. Explicit `#landing` always opens it.
- Returning users who completed/skipped optional setup: `/` opens `#home`.
- `#home`: practical overview, conditional real activity, planned routine, recent activity, curated discovery.
- `#library`: ten supported exercises with combined search, filters and favorites.
- `#details`: original movement visual, narrated demonstration, targets, camera view, steps and supported feedback limits.
- `#workbench`: setup first on smaller screens, camera first during an active session. Actions precede optional advanced controls.
- Existing `#plan`, `#journal`, `#progress`, `#coach`, `#profiles`, `#settings`, `#help` remain compatible.
- New About, Privacy and project-use notice routes contain real project information. No invented commercial services or company credentials.

Public exploration does not open the onboarding dialog. Entering a task can offer optional setup; it never requests camera permission. Onboarding does not overwrite targets configured on an exercise detail page.

## Visual asset system

See [ASSETS.md](ASSETS.md) for source and licensing. Real home-workout photography anchors the homepage; mobility photography supports About. All ten thumbnails are original, consistent instructional SVG artwork, with exercise-specific poses. They are intentionally labeled illustrations through accessible names and detail captions. They are not photographs or medical instruction credentials. Narrated clay demonstrations remain functional rather than being replaced by static artwork.

A complete, matching ten-exercise photographic shoot was not available in the supplied files. The current catalog uses original illustrations instead of mismatched stock photos. A commissioned/verified photograph series is an optional remaining asset improvement, not a broken-image placeholder.

## Refinement after browser inspection

1. Fixed a 320px overflow caused by image aspect-ratio/min-height sizing.
2. Reset the app's large-desktop centering transform for the public homepage, fixing a 109px overflow at 1920px.
3. Removed fixed thumbnail heights and embedded tiny image labels that cropped at different aspect ratios.
4. Delayed optional setup until app entry; exercise exploration stays unobstructed.
5. Preserved custom detail targets when optional setup is skipped.
6. Grouped settings into appearance/accessibility, workout defaults and voice coaching.
7. Moved mobile setup and camera actions before the idle preview; starting a session reorders the camera to the front and scrolls to it.
8. Reduced active setup clutter while keeping coaching, pause, notes and finish controls available.
9. Repaired skip-link behavior so keyboard users stay on the current page rather than accidentally routing to the dashboard.
10. Reset video-analysis status immediately on a new analysis. A repeated-video routine exposed stale completion text that could suggest analysis had finished before it did.
11. Added an observed min–max angle range chart with an exact-value table; it uses saved records only and makes no recovery-score claim.

Testing evidence and remaining verification limits are recorded in DESIGN_OVERHAUL.md. Automated accessibility checks do not replace a complete assistive-technology audit; synthetic pose inputs do not verify clinical or physical-device accuracy.
12. Added a defensive target-option check and a regression test for non-preset default repetition targets (for example seven reps), including persistence after reload.
