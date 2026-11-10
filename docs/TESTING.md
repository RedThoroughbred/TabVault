# Chrome + Firefox manual testing

All tests should use disposable HTTP(S) URLs, such as example.com, example.org and developer.mozilla.org. Do not use unsaved forms.

1. In each browser, create two tab groups in two windows, with different names/colors and at least 2 tabs each.
2. Open Tab Vault, select All browser windows. Expand both groups; switch to a tab in the other window.
3. Save copy, then Stash & close. Confirm saved snapshots are retained and only selected tabs close.
4. Confirm closed group status. Restore that group into current window. Status should update on refresh.
5. Save whole workspace, then save unchanged workspace again: no duplicate should be created.
6. Restore a single group, single window and entire workspace. Verify number/order/colors and best-effort window positions.
7. Use Review duplicates on two matching URLs; confirm no data is removed. Test deduplicate checkbox when capturing.
8. Export JSON, import identical file; confirm no extra duplicate workspace. Export Markdown and ensure nested workspace group links appear.
9. Enable 30-minute automatic snapshots; confirm a snapshot appears after timer (timing may drift), then disable.
10. Restart Chrome/Firefox. A normally installed extension's saved state should persist. **Temporary Firefox add-ons do not remain installed across restart**; do not mistake this for data loss.
11. Test import of Chrome JSON into Firefox and Firefox JSON into Chrome on separate browser profiles.
12. Check browser extension console for errors, especially background-script alarm and window-position compatibility.

**Rollback:** Export JSON before upgrades. Chrome: restore the previous files into the **same loaded folder** and reload. Firefox: reload temporary add-on. Never delete live tabs until the capture/restore test succeeds.
