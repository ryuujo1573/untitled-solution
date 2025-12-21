#!/usr/bin/env bun
/**
 * Git hook script to append Co-Authored-By trailer to commit message
 * Usage: bun run scripts/append-co-author.ts <commit-msg-file>
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'bun'
import AI_CONFIG from './ai-models.json'

const AI_MODEL_FILE = join(import.meta.dir, '..', '.ai-model')

function main() {
  const commitMsgFile = process.argv[2]
  if (!commitMsgFile) {
    console.error('Error: No commit message file provided')
    process.exit(1)
  }

  if (!existsSync(AI_MODEL_FILE)) {
    return // No model selected, do nothing
  }

  const modelValue = readFileSync(AI_MODEL_FILE, 'utf-8').trim()
  if (modelValue === 'human' || modelValue.startsWith('None')) {
    return // Manual mode, do nothing
  }

  const series = Object.values(AI_CONFIG).find((s: any) =>
    s.models.some((m: any) => m.value === modelValue),
  ) as any

  if (!series || !series.email) {
    return // Unknown model or no series email, do nothing
  }

  const trailer = `Co-Authored-By: ${series.name} <${series.email}>`

  // Use git interpret-trailers to append the trailer correctly
  const result = spawnSync({
    cmd: [
      'git',
      'interpret-trailers',
      '--where',
      'end',
      '--if-exists',
      'replace',
      '--trailer',
      trailer,
      '--in-place',
      commitMsgFile,
    ],
  })

  if (result.exitCode === 0) {
    console.log(`\x1b[32m✔ Updated co-author for ${modelValue}\x1b[0m`)
  } else {
    console.error(`\x1b[31m✖ Failed to update co-author\x1b[0m`)
  }
}

main()
