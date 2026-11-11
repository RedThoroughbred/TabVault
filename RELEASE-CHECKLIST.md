# Release & Store Submission Checklist

## Prepared

- [x] MIT license (`LICENSE`), author `Seth Egger`, version `1.0.1` in `package.json`, both manifests and `src/popup.html`.
- [x] Firefox manifest declares no data collection and requires Firefox 140+ (addons.mozilla.org requires the declaration for new add-ons).
- [x] Popup wording is browser-neutral (Firefox users no longer see "Chrome").
- [x] `npm test` passes, and `npm run package` builds `releases/tab-vault-chrome-v1.0.1.zip` and `releases/tab-vault-firefox-v1.0.1.zip`.
- [x] Store screenshots in `docs/store/` (1280x800, the real popup with made-up sample tabs).
- [x] Repository scanned for personal/employer-specific URLs, keys, or tokens.

## 1. Test the exact files you'll upload

The earlier live tests predate the Firefox manifest, checkbox and wording changes, so test once more.

- [ ] **Chrome:** run `unzip -oq releases/tab-vault-chrome-v1.0.1.zip -d /tmp/tv-chrome`, then `chrome://extensions` → Developer mode → **Load unpacked** → `/tmp/tv-chrome`.
- [ ] **Firefox:** `about:debugging` → **This Firefox** → **Load Temporary Add-on…** → pick `releases/tab-vault-firefox-v1.0.1.zip` (Firefox removes it when it restarts).
- [ ] **In both:** make two tab groups, then Save all groups; Stash & close one and restore it; Save entire workspace; Export JSON. The checkboxes sit beside their labels, and no text names the wrong browser.

## 2. Before submitting

- [x] Decide the Firefox add-on ID: `tabvault@sethegger.local` in `manifests/firefox.json` stays (decided 2026-11-11). It can't change after the first upload.
- [x] Publish the GitHub repository: pushed private, reviewed, made public on 2026-11-11. The manifests' `homepage_url`, both store listings and the privacy policy link point to `https://github.com/RedThoroughbred/TabVault`.

## 3. Chrome Web Store ($5 one-time)

- [ ] Open the [Developer Dashboard](https://chrome.google.com/webstore/devconsole), sign in (the Google account needs 2-Step Verification), pay the fee and set the publisher name to `Seth Egger`.
- [ ] **New item** → upload `releases/tab-vault-chrome-v1.0.1.zip`.
- [ ] **Store listing:** description from [`docs/CHROME-WEB-STORE.md`](docs/CHROME-WEB-STORE.md), category Productivity, icon `src/icons/icon128.png`, screenshots from `docs/store/`.
- [ ] **Privacy practices:** the single-purpose text and the four permission justifications from the guide; data type **Web history** only (saved tab titles and URLs stay on the device, and Google requires the disclosure even for local storage); the three certifications; privacy policy = `PRIVACY.md` on GitHub. If the form asks about remote code, answer "No".
- [ ] **Submit for review** (usually a few days).

## 4. Firefox Add-ons (free)

- [ ] Open the [Developer Hub](https://addons.mozilla.org/developers/) and sign in with a Mozilla account.
- [ ] **Submit a New Add-on** → **On this site** → upload `releases/tab-vault-firefox-v1.0.1.zip`. Fix any validation errors; warnings are fine.
- [ ] **Source code:** answer No. The zip holds the unminified source as is (`npm run build` only copies files).
- [ ] **Listing:** reuse the Chrome text; category Tabs; license MIT; support site = the GitHub issues page; screenshots from `docs/store/`; listing icon `src/icons-firefox/icon128.png` (Mozilla does not take it from the package).
- [ ] **Submit** (often listed within a day).
