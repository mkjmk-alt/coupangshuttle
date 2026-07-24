import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const dataDirectory = path.join(projectRoot, 'public', 'data');
const sourcePath = path.join(dataDirectory, 'shuttle_data.json');
const indexPath = path.join(dataDirectory, 'shuttle_index.json');
const centersDirectory = path.join(dataDirectory, 'centers');

const sourceText = await readFile(sourcePath, 'utf8');
const sourceData = JSON.parse(sourceText);
const sourceVersion = createHash('sha256').update(sourceText).digest('hex').slice(0, 16);

await mkdir(centersDirectory, { recursive: true });

const expectedFiles = new Set();
const indexCenters = {};
let centerBytes = 0;
let largestCenter = { code: '', bytes: 0 };

for (const [fcCode, card] of Object.entries(sourceData)) {
  if (!/^[A-Za-z0-9_-]+$/.test(fcCode)) {
    throw new Error(`Unsafe center code in shuttle data: ${fcCode}`);
  }

  const fileName = `${fcCode}.json`;
  const centerJson = JSON.stringify(card);
  expectedFiles.add(fileName);
  centerBytes += Buffer.byteLength(centerJson);

  if (Buffer.byteLength(centerJson) > largestCenter.bytes) {
    largestCenter = { code: fcCode, bytes: Buffer.byteLength(centerJson) };
  }

  await writeFile(path.join(centersDirectory, fileName), centerJson);

  const shifts = {};
  for (const [shiftName, routes] of Object.entries(card.shifts ?? {})) {
    shifts[shiftName] = Object.fromEntries(
      Object.keys(routes ?? {}).map((routeName) => [routeName, []]),
    );
  }

  indexCenters[fcCode] = {
    code: card.code ?? fcCode,
    center: card.center ?? {},
    shifts,
  };
}

for (const entry of await readdir(centersDirectory, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.json') && !expectedFiles.has(entry.name)) {
    await rm(path.join(centersDirectory, entry.name));
  }
}

const indexJson = JSON.stringify({
  version: sourceVersion,
  centers: indexCenters,
});
await writeFile(indexPath, indexJson);

const formatSize = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
console.log(
  `Generated ${expectedFiles.size} center files. ` +
  `Index: ${formatSize(Buffer.byteLength(indexJson))}, ` +
  `largest center: ${largestCenter.code} ${formatSize(largestCenter.bytes)}, ` +
  `all centers: ${formatSize(centerBytes)}.`,
);
