# Changelog

## 1.0.1 — November 11, 2026
- New icon artwork with no third-party logos: the centre of the vault dial is now a plain hub (it used to show a browser logo).
- Each build has its own icon set: a blue hub for Chrome (`src/icons/`) and an orange hub for Firefox (`src/icons-firefox/`).
- No changes to features, permissions or stored data.

## 1.0.0 — November 10, 2026
- Official v1.0.0 open-source release under the MIT License by Seth Egger.
- Verified builds and functionality in both Google Chrome and Mozilla Firefox (140+).
- Firefox: the manifest declares that Tab Vault collects no data (`data_collection_permissions`), which addons.mozilla.org requires for new add-ons; Firefox 140 or later is now required.
- Streamlined browser-specific `dist/chrome` and `dist/firefox` build outputs and added `npm run package` to produce ready-to-upload `.zip` archives in `releases/`.
- Added Chrome Web Store submission guide (`docs/CHROME-WEB-STORE.md`) with permission justifications and store listing metadata.

## 0.4.0 — November 9, 2026 (developer preview)
- Chrome + Firefox 139+ source builds, shared code and distinct manifests.
- Non-destructive duplicate URL review and duplicate workspace save/import detection.
- Markdown export includes both standalone saved groups and groups inside workspaces.
- Retained legacy storage keys and JSON v3 import/export.
- Node.js simulated-API tests, GitHub documentation and security checklist.

## 0.3.4 and earlier
- Tab groups, status memory, multi-window workspaces, granular restore, JSON backups, icon and creator credits.
