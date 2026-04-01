#!/usr/bin/env node
// push.js — run this from your repo root to push Claude's changes to GitHub
// Usage: node push.js

import { execSync } from 'child_process'
import { existsSync, copyFileSync } from 'fs'
import { join } from 'path'

const FILES = [
  // [source in this script's folder, destination in repo]
  ['generate.js',  'generate.js'],
  ['index.js',     'src/index.js'],
]

const COMMIT_MSG = process.argv[2] || 'chore: update from Claude session'

console.log('🚀 Pushing Claude changes to GitHub...\n')

let copied = 0
for (const [src, dest] of FILES) {
  const srcPath  = join(import.meta.dirname, src)
  const destPath = join(process.cwd(), dest)
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, destPath)
    console.log(`  ✅  Copied ${src} → ${dest}`)
    copied++
  } else {
    console.log(`  ⚠️   Skipped ${src} (not found)`)
  }
}

if (copied === 0) {
  console.log('\n❌ No files to push. Make sure you run this from your repo root.')
  process.exit(1)
}

try {
  execSync('git add generate.js src/index.js', { stdio: 'inherit' })
  execSync(`git commit -m "${COMMIT_MSG}"`, { stdio: 'inherit' })
  execSync('git push origin main', { stdio: 'inherit' })
  console.log('\n🎉 Pushed! Cloudflare will rebuild automatically.')
} catch (e) {
  console.error('\n❌ Git error:', e.message)
}
