import { readFileSync } from 'fs'
import { join } from 'path'
import electron from 'electron'
import { spawn } from 'child_process'
import { createServer } from 'vite'
import esbuild from 'esbuild'
import { dist, generateBaseFile, getPath, workSpace } from "./util.mjs";

process.env.NODE_ENV = 'development'

const { __dirname } = getPath(import.meta.url)

const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))

function esbuildPromise (entry, outFile, onRebuild) {
  return esbuild.build({
    entryPoints: entry,
    outfile: outFile,
    absWorkingDir: join(__dirname, '../'),
    bundle: true,
    platform: 'node',
    external: ['electron'],
    watch: {
      onRebuild (error) {
        if (error) {
          console.error('watch build failed:', error)
        } else {
          onRebuild()
        }
      },
    }
  }).then((result) => {
    console.log('watching...')

    if (result.errors.length) {
      console.error('watch build failed:', result.errors)
    } else {
      onRebuild()
    }
  })
}

async function watchMain () {
  let electronProcess = null

  return esbuildPromise(
    [join(workSpace, './src/main/index.ts')],
    join(dist, './main/index.js'),
    () => {
      electronProcess && electronProcess.kill()
      electronProcess = spawn(electron, ['.'], {
        stdio: 'inherit',
        env: Object.assign(process.env, pkg.env), // Why don't work?
      })
    })
}

async function watchPreload (viteDevServer) {
  return esbuildPromise(
    [join(workSpace, './src/preload/index.ts')],
    join(dist, './preload/index.js'),
    () => {
      viteDevServer.ws.send({
        type: 'full-reload',
      })
    })
}

// bootstrap
const viteDevServer = await createServer({ configFile: join(workSpace, 'configs/vite.renderer.ts') })

generateBaseFile()
await viteDevServer.listen()
await watchPreload(viteDevServer)
await watchMain()
