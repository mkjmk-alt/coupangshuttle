import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const css = fs.readFileSync(path.join(root, 'app/pastel.css'), 'utf8');
const component = fs.readFileSync(path.join(root, 'components/ShuttleExplorer.tsx'), 'utf8');

assert.match(component, /route-results-route-name/);
assert.match(css, /\.route-results-route-name\s*\{[^}]*white-space:\s*nowrap/s);

console.log('Route labels keep their text on one line.');
