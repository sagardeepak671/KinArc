# Data migration, sync and production configuration

## Migration and recovery

1. Open the updated app on the same browser origin as the old version. Different ports/domains are different origins.
2. Identity is resolved first. The guest workspace reads legacy `kinarc.*` keys; a verified account reads only `account.<encoded uid>.kinarc.*` keys.
3. Migration writes all scoped records plus the migration marker in one IndexedDB transaction. The localStorage originals remain untouched.
4. Existing source arrays receive stable IDs. A failed migration shows a retry screen and preserves originals. Export old browser data before clearing anything.
5. New writes use IndexedDB; after migration, changes to old localStorage are not re-imported automatically. Use the JSON import/export UI for deliberate transfers.

JSON restore validates record shapes, duplicate IDs, routine ranges and file size before replacing data in one transaction. The default maximum JSON import is 10 MB. Browser quota failures must be resolved by exporting/freeing storage; the app does not discard old data to make space. A restored backup turns sync off until renewed opt-in.

## Guest-to-account transfer

Sign in, then choose **Import guest profiles into this account**. Guest profiles are copied under distinct stable profile IDs; existing account data is retained. Repeating the import avoids duplicate guest profiles. Original guest data stays intact. Cloud sync is disabled by the transfer until the user explicitly re-enables it.

## Production Firebase checklist

The configured `productivito` project is shared. This upgrade does not publish or replace any shared rules or Auth setting.

1. Prefer a dedicated KinArc project for real users. If retaining the shared project, audit all existing rules: a broader permissive match can override the effect of a restrictive KinArc block.
2. Add the actual deployment hostname to Firebase Authentication authorized domains. Enable Google provider if using a new project. Set only the public web configuration in `src/firebase-config.mjs`; never add client secrets or service-account keys to frontend files.
3. Merge only the `match /kinarcV2/{uid}/records/{recordId}` block from `firestore.rules` into the chosen ruleset. Do not replace unrelated app rules/data. Select an appropriate Firestore region and review quotas/privacy obligations.
4. Run `npm run test:rules`. This launches only local Auth/Firestore emulators with project `demo-kinarc`, validates rules, and runs browser account/sync tests.
5. Verify owner-only reads/writes against the real configured environment with test accounts and no real health history. Confirm no unrelated wildcard grants access.
6. Set `cloudEnabled = true` only after those checks; rebuild. Users must still explicitly opt in before any history is uploaded.

Sync is record-based, including deletion tombstones. Concurrent modifications to one record require the user to choose a version; there is no silent merge of notes or medical-style data. Automatic sync is debounced and listener driven. A status shows errors/last sync; local changes remain queued when offline. Downloaded changes are reflected in the local database; a reload is offered to fully refresh visible views. Local schema keys and timestamps are versioned data, not credentials.

The app does not delete shared Firebase Auth users because the same identity may be used by another application. Local profile removal does not delete a Google account. Account-local data remains subject to browser access; sign-in is not encryption of files on a shared device.
