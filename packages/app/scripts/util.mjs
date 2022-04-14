import path, { join, relative } from "path";
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "fs";
import chalk from "chalk";
import url from "url";
import fsExtra, { mkdirpSync } from 'fs-extra'

const { __dirname } = getPath(import.meta.url)

const pkg = JSON.parse(
  readFileSync(
    new URL('../package.json', import.meta.url)
  )
);

export function getPath (url2) {
  const __filename = url.fileURLToPath(url2);
  const __dirname = path.dirname(__filename);
  return { __filename, __dirname }
}

export const workSpace = join(__dirname, '../')
export const dist = join(workSpace, 'dist')

function createPackageJson () {
  const target = join(dist, 'package.json')

  const tpl = readFileSync(join(__dirname, 'package.json.tpl'), 'utf-8');
  const content = tpl.replace(/{{version}}/g, pkg.version);
  console.log(`${chalk.green('Write:')} ${relative(workSpace, target)}`);
  writeFileSync(target, content, 'utf-8');
}

export function generateBaseFile () {
  if (!existsSync(dist)) {
    mkdirpSync(dist)
  }

  createPackageJson()

  copyFileSync(join(workSpace, './scripts/mitmproxy.js'), join(dist, 'mitmproxy.js'))
  fsExtra.copySync(join(workSpace, './public/assets'), join(dist, 'assets'))
}
