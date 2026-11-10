# Tab Vault privacy notes

Tab Vault is a local-first browser extension. The extension code contains no analytics, remote APIs, tracking, or content scripts. Tab and group metadata is read through the browser's `tabs` and `tabGroups` APIs and persisted using `chrome.storage.local`.

## Data collected locally

Saved tab titles, URLs, group names/colors, snapshots, workspace window coordinates, and timestamps. URLs may contain confidential query strings or internal hostnames. The extension does not intentionally copy page contents, cookies, or passwords. Chrome is still responsible for loading restored URLs, which may contact their websites normally.

## Data sharing

The extension has no extension-controlled network endpoint. JSON and Markdown exports are explicit downloads; you decide where to store/share them. No Obsidian file writes or synchronization are performed.

## Security limitations

Storage and exports are **not encrypted**; they are accessible to software with sufficient permission to read your browser profile or exported files. No independent security audit has been performed.

## Deleting data

Delete saved collections in the popup or remove the extension (which generally removes local extension storage). Export a backup before uninstalling or changing browser profiles.
