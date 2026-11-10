# Firefox port notes

Firefox 139+ supports tabs.group and tabGroups query/update, enabling the same group management UX as Chrome. The Firefox Manifest V3 build uses `background.scripts` (the browser does not run Chrome-style background service workers). It loads `core.js` before `background-firefox.js` so TV is already defined.

The shared source currently uses the `chrome.*` namespace with Promise-returning calls, which Firefox generally provides as a compatibility alias; confirm this on your target Firefox build. Some features such as tab selection, collapsed-group focus, window geometry, and alarm scheduling can differ across browsers. These are part of the Firefox manual test plan.

Firefox temporary add-ons loaded through about:debugging are removed on restart. Public or persistent installation generally requires Mozilla signing and a properly registered add-on ID. The development ID used in this source is a placeholder and should be changed to a verified project domain before publication.

The `tab-vault-v3` JSON file can be transferred between Chrome and Firefox, but no automatic data synchronization is implemented.
