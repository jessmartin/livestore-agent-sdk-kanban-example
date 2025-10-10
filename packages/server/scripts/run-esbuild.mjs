#!/usr/bin/env node
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const rootDir = process.cwd()
// In a monorepo, the .pnpm directory is at the workspace root (two levels up from packages/server)
const workspaceRoot = join(rootDir, '..', '..')
const pnpmDir = join(workspaceRoot, 'node_modules', '.pnpm')

let esbuildBin = null
try {
  const entries = readdirSync(pnpmDir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('esbuild@')) {
      esbuildBin = join(pnpmDir, entry.name, 'node_modules', 'esbuild', 'bin', 'esbuild')
      break
    }
  }
} catch (error) {
  console.error('[server/scripts/run-esbuild] Unable to locate pnpm store:', error)
  process.exit(1)
}

if (!esbuildBin) {
  console.error('[server/scripts/run-esbuild] esbuild binary not found. Please ensure dependencies are installed.')
  process.exit(1)
}

const result = spawnSync(esbuildBin, process.argv.slice(2), {
  stdio: 'inherit',
  cwd: rootDir,
})

if (typeof result.status === 'number') {
  process.exit(result.status)
}

process.exit(1)
