# Tab Vault 🔐 — Chrome & Firefox

**Created by Seth Egger · v1.0.0 · [MIT License](LICENSE)**

Local-first tab-group and multi-window workspace manager for **Google Chrome** and **Mozilla Firefox (140+)**. No accounts, analytics, third-party scripts, or extension-controlled network connections.

## Features

- **Save, stash, search, and restore** tab groups and entire multi-window workspaces.
- **Granular restore:** restore one tab, one group, one window, or the complete saved workspace.
- **Live presence badges:** see *Open*, *Partially open*, or *Closed* saved-group status across browser windows.
- **Non-destructive duplicate review:** inspect duplicate URLs within and across collections without deleting anything; optionally skip duplicate URLs when capturing groups or workspaces.
- **Deduplicated saves & imports:** prevent identical workspace saves and duplicate imports automatically.
- **Portable backups:** export/import `tab-vault-v3` JSON; export Markdown with standalone and workspace groups for Obsidian.
- **Automatic snapshots:** optional 30-minute background snapshots (retaining up to 3 automatic versions per group title/color).

## Repository Layout

```text
src/                       Shared browser extension code + icons
manifests/chrome.json      Chrome Manifest V3
manifests/firefox.json     Firefox Manifest V3 (Firefox 140+)
scripts/build.mjs          Dependency-free build script
scripts/package.mjs        Packages dist/chrome and dist/firefox into .zip archives
dist/chrome/               Unpacked Chrome extension (generated)
dist/firefox/              Unpacked Firefox extension (generated)
tests/                     Node.js simulated-API unit tests
docs/                      Testing, Firefox notes, and Chrome Web Store submission guide
```

## Build, Test, and Package

```sh
node --version   # Node 18+ required
npm run build    # Builds dist/chrome and dist/firefox (zero external dependencies)
npm test         # Runs unit test suite
npm run package  # Generates releases/tab-vault-chrome-v1.0.0.zip and firefox .zip
```

## Browser Installation

### Google Chrome (Unpacked / Developer Mode)

1. Run `npm run build`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select `dist/chrome/`.

> **Updating an existing unpacked Chrome installation without losing data:**
> First export a JSON backup from Tab Vault. Then copy the updated contents of `dist/chrome/` into the **same folder** Chrome already has loaded and click **Reload** on `chrome://extensions`. Do not uninstall the extension if you want to keep existing local storage in place.

### Mozilla Firefox (140+)

1. Run `npm run build`.
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on…** and select `dist/firefox/manifest.json`.
3. Note: Chrome and Firefox maintain separate browser-local extension storage. To transfer workspaces and groups between browsers, use **Export JSON** in one browser and **Import JSON** in the other.

### Why Not Safari?

While Safari supports Web Extensions in general, **Safari/WebKit does not implement the WebExtensions `tabGroups` API (`chrome.tabGroups` / `browser.tabGroups`) or `tabs.group()`**. Because Tab Vault relies directly on the `tabGroups` API to inspect, group, title, and color-code native browser tab groups, Safari cannot currently be supported.

## Privacy & Security

Tabs' URLs and titles, group metadata, timestamps, and workspace window geometry are stored strictly in **browser-local extension storage (`chrome.storage.local`)**. JSON and Markdown exports are plaintext files saved locally by you and may contain private URLs or query tokens—never commit personal exports to Git. No page contents, form inputs, or cookies are collected.

**Permissions:** `tabs`, `tabGroups`, `storage`, `alarms`. There are no host permissions, content scripts, or network requests from extension code.

See [PRIVACY.md](PRIVACY.md), [SECURITY.md](SECURITY.md), [CREDITS.md](CREDITS.md), [docs/CHROME-WEB-STORE.md](docs/CHROME-WEB-STORE.md), and [LICENSE](LICENSE).

## Author & License

Created by **Seth Egger** ([@RedThoroughbred](https://github.com/RedThoroughbred)).
Released under the [MIT License](LICENSE).
