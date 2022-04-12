import esbuild from "esbuild";
import { join } from 'path'
import { build as viteBuild } from 'vite'
import { build as electronBuild } from 'electron-builder'
import chalk from 'chalk'
import electron from "electron";
import { config as builderConfig, targets } from '../configs/electron-builder.config.mjs'
import { generateBaseFile, workSpace } from "./util.mjs";

process.env.NODE_ENV = 'production'

const TAG = chalk.bgBlue('[build.mjs]')

function esbuildSync (entry, outFile, name = 'default') {
  console.group(TAG, name)

  esbuild.buildSync({
    entryPoints: entry,
    outfile: outFile,
    absWorkingDir: workSpace,
    bundle: true,
    platform: 'node',
    external: ['electron', '@fast-dev/core'],
  })

  console.groupEnd()
  console.log()
}

async function buildElectron () {
  esbuildSync([join(workSpace, './src/main/index.ts')], join(workSpace, './dist/main/index.js'), 'main')
  esbuildSync([join(workSpace, './src/preload/index.ts')], join(workSpace, './dist/preload/index.js'), 'preload')

  console.group(TAG, 'renderer')
  await viteBuild({
    configFile: join(workSpace, 'configs/vite.renderer.ts'),
    mode: process.env.NODE_ENV,
  })
  console.groupEnd()
  console.log()
}

async function packElectron () {
  return electronBuild({
    ...targets,
    config: builderConfig,
  }).then(result => {
    console.log(TAG, 'files:', chalk.green(result))
  })
}

generateBaseFile()
await buildElectron()
await packElectron()
