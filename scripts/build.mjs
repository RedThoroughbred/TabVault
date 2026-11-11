import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sharedFiles = ['core.js', 'workspace.js', 'popup.js', 'popup.html', 'popup.css'];
const browserFiles = {
  chrome: [...sharedFiles, 'background.js'],
  firefox: [...sharedFiles, 'background-firefox.js']
};
// Each browser has its own icon set: the same artwork, with a blue dial hub for Chrome and an orange one for Firefox.
const iconDirs = {chrome: 'icons', firefox: 'icons-firefox'};

for (const [browser, files] of Object.entries(browserFiles)) {
  const out = path.join(root, 'dist', browser);
  fs.rmSync(out, {recursive: true, force: true});
  fs.mkdirSync(out, {recursive: true});
  for (const name of files) {
    fs.copyFileSync(path.join(root, 'src', name), path.join(out, name));
  }
  fs.cpSync(path.join(root, 'src', iconDirs[browser]), path.join(out, 'icons'), {recursive: true});
  fs.copyFileSync(path.join(root, 'manifests', `${browser}.json`), path.join(out, 'manifest.json'));
  console.log(`Built dist/${browser}`);
}
