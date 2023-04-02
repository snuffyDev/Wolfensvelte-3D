import { resolve } from 'path';
import { promises } from 'fs';

const { readdir, rename } = promises;

const DIRECTORY = 'src/lib/textures';

async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

(async () => {
  for await (const originalFilePath of getFiles(DIRECTORY)) {
    const parts = originalFilePath.split('.');

    parts[0] = parseInt(parts[0]) + 1;
    const newFilePath = parts.join('.');
    await rename(originalFilePath, newFilePath);
  }
})()