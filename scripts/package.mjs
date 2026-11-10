import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import './build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const releasesDir = path.join(root, 'releases');
fs.mkdirSync(releasesDir, {recursive: true});

for (const browser of ['chrome', 'firefox']) {
  const distDir = path.join(root, 'dist', browser);
  const zipName = `tab-vault-${browser}-v${pkg.version}.zip`;
  const zipPath = path.join(releasesDir, zipName);
  fs.rmSync(zipPath, {force: true});
  execFileSync('zip', ['-r', '-q', zipPath, '.', '-x', '*.DS_Store'], {cwd: distDir});
  console.log(`Packaged releases/${zipName}`);
}
