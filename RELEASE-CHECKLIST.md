# Local Release & Store Submission Checklist

- [x] Choose open-source license (`MIT` in `LICENSE`) and set author to `Seth Egger`.
- [x] Verify Chrome and Firefox 139+ builds and live browser testing.
- [x] Bump version to `1.0.0` across `package.json`, `manifests/chrome.json`, `manifests/firefox.json`, and `src/popup.html`.
- [x] Run `npm test` and `npm run package` to generate `releases/tab-vault-chrome-v1.0.0.zip` and `releases/tab-vault-firefox-v1.0.0.zip`.
- [x] Scan repository for personal/employer-specific URLs, keys, or tokens.
- [ ] Push local Git repository (`main` branch) to GitHub (`https://github.com/RedThoroughbred/TabVault`).
- [ ] Submit `releases/tab-vault-chrome-v1.0.0.zip` to the Chrome Web Store following [`docs/CHROME-WEB-STORE.md`](docs/CHROME-WEB-STORE.md).
