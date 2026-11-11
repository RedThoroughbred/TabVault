# Chrome Web Store Submission Guide for Tab Vault

This guide contains everything needed to publish **Tab Vault - Group Stash** (`v1.0.0`) by **Seth Egger** to the Chrome Web Store, including ready-to-paste permission justifications and privacy disclosures.

---

## 1. Upload Package

Run `npm run package` to generate the uploadable archive:

- **Upload file:** `releases/tab-vault-chrome-v1.0.0.zip`

> **Important:** Upload `releases/tab-vault-chrome-v1.0.0.zip` (which zips the contents of `dist/chrome/` with `manifest.json` at the root of the archive), **not** the entire repository folder.

---

## 2. Developer Account Setup

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with your Google account and pay the one-time $5 developer registration fee (if not already registered).
3. In the **Account** tab:
   - **Publisher Name:** `Seth Egger`
   - **Contact Email:** Add and verify your contact email address (required before publishing).

---

## 3. Store Listing Fields (Ready to Copy-Paste)

- **Title (from manifest):** `Tab Vault - Group Stash`
- **Summary (from manifest, ≤132 chars):**
  `Tab Vault by Seth Egger: save, search and restore tab groups and multi-window workspaces locally.`
- **Category:** `Productivity` → `Workflow & Planning` (or `Tools`)
- **Language:** `English (United States)`
- **Homepage / Official URL:** `https://github.com/RedThoroughbred/TabVault`
- **Support URL:** `https://github.com/RedThoroughbred/TabVault/issues`

### Detailed Description (Paste into Store Listing Description)

```text
Tab Vault is a fast, local-first tab group and multi-window workspace manager created by Seth Egger. Save open tab groups, stash and close clutter when switching contexts, and restore individual tabs, groups, windows, or entire multi-monitor workspaces anytime.

KEY FEATURES
• Save & Stash Tab Groups: Capture open tab groups in the current window or across all windows. Optionally stash and close captured tabs once verified in local storage.
• Multi-Window Workspaces: Save all grouped tabs across multiple windows/monitors as a named workspace. Restore the entire workspace, a single window, or a single group.
• Live Presence Status: Instantly see whether saved groups are currently Open, Partially Open, or Closed.
• Duplicate URL Review: Non-destructively inspect duplicate URLs within groups or across saved collections, and optionally skip duplicate URLs when saving.
• Portable JSON & Obsidian Markdown Exports: Export and import JSON backups (tab-vault-v3) or export formatted Markdown notes for Obsidian.
• Automatic Snapshots: Optional 30-minute background snapshots retain up to 3 automatic versions per group name and color without closing any tabs.

100% LOCAL & PRIVATE BY DESIGN
• No accounts, no cloud sync, no analytics, and no remote network requests.
• Zero host permissions and zero content scripts—Tab Vault never reads page content, passwords, cookies, or form data.
• Open source under the MIT License: https://github.com/RedThoroughbred/TabVault
```

---

## 4. Visual Assets Required by Chrome Web Store

Chrome Web Store requires the following graphic assets in the **Store Listing** tab:

1. **Store Icon:** `128x128` PNG (you can upload `src/icons/icon128.png`).
2. **Screenshots (at least 1 required, up to 5):**
   - Dimensions must be **`1280x800`** or **`640x400`** PNG/JPEG (no alpha transparency).
   - Ready to upload: `docs/store/chrome-1-groups.png` and `docs/store/chrome-2-workspaces.png` (1280x800, the real popup with made-up sample tabs). They also fit the Firefox and Edge listings.
3. **Small Promo Tile (optional):** `440x280` PNG/JPEG.

---

## 5. Privacy Practices Tab (Ready to Copy-Paste)

Google requires explicit answers in the **Privacy practices** tab for every permission in `manifest.json`. Copy and paste the following responses:

### Single Purpose Description
```text
Tab Vault saves, searches, exports, and restores browser tab groups and multi-window tab-group workspaces using local browser storage.
```

### Permission Justifications

- **`tabs` justification:**
  ```text
  Required to read tab titles, HTTP(S) URLs, window IDs, and group IDs when capturing tab groups or searching open tabs, and to create, focus, group, or close tabs when the user explicitly stashes or restores a saved tab group or workspace.
  ```

- **`tabGroups` justification:**
  ```text
  Required to query existing browser tab groups (title, color, collapsed state) and to create and update tab group titles, colors, and collapsed states when restoring saved groups or workspaces.
  ```

- **`storage` justification:**
  ```text
  Required to persist saved tab group snapshots, multi-window workspaces, and user preferences locally on the user's device via chrome.storage.local.
  ```

- **`alarms` justification:**
  ```text
  Required to schedule the optional user-enabled 30-minute periodic background snapshot of currently open tab groups.
  ```

- **Remote Code (only if the form asks; it did not for this Manifest V3 package in November 2026):**
  Select **"No, I am not using Remote code."** (All JavaScript is bundled directly inside the extension package with no external scripts or dependencies.)

### Data Usage Disclosures
- **What user data do you plan to collect from users now or in the future?**
  Tick **Web history** and nothing else. Tab Vault saves the titles and URLs of the tabs a user chooses to save, with the time they were saved, in `chrome.storage.local` on the user's own device. It never transmits any of it. Google's [User Data FAQ](https://developer.chrome.com/docs/webstore/user_data/) (question 3) requires the disclosure even when data is only processed or stored locally, and "Web history" is the box that describes page URLs, titles and times.
- **Certify compliance checkboxes:** Check all three Developer Program Policy certifications. All three hold: the extension makes no network requests, so no user data is sold, transferred or used for anything else.
- **Privacy Policy URL (required):** `https://github.com/RedThoroughbred/TabVault/blob/main/PRIVACY.md`
