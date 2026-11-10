# Security and responsible disclosure

This is an early personal/open-source candidate, not independently audited security software. The extension requires `tabs`, `tabGroups`, `storage`, and `alarms`; no host permissions, content scripts, remote dependencies, or network services are included.

- **Do not commit** real Tab Vault exports, private internal URLs, authentication tokens, or screenshots with sensitive content.
- Local browser storage and exported backups are plaintext. Keep backups protected.
- Import validates formats, URL schemes and basic size limits, but imported links can still lead to malicious websites; import only trusted backups.
- Tab stashing saves before closing and checks captured tab IDs, URL and group ID before removal. This cannot preserve unsaved form data.
- Workspace restoration creates new windows and may duplicate tabs.
- Please report vulnerabilities privately to the repository owner using GitHub private vulnerability reporting once configured; do not publish credentials or sensitive URLs in issues.
