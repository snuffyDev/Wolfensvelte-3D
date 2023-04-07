import { resolve } from 'path';
import { promises } from 'fs';

const { readdir, rename } = promises;

const DIRECTORY = 'src/lib/sprites/objects';

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = []
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isFile()) {
      files.push(res);
      // yield* getFiles(res);
    }
  };
  return files.reverse();
}

const files = await getFiles(DIRECTORY)
  for (let idx = 0; idx < files.length; idx++) {
    const originalFilePath = files[idx];

    /** @type {string[]} */
    const parts = originalFilePath.split('.');
    const pathParts = parts[0].split('/');

   /**
    * @type {string}
    */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const fileName = pathParts.pop()?.replace('tile', '');

    parts[0] = `${pathParts.join('/')}/${parseInt(fileName) + 1}`;
    const newFilePath = parts.join('.');
    // console.log(newFilePath);
    await rename(originalFilePath, newFilePath);
  }