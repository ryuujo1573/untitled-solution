#!/usr/bin/env bun
/**
 * Pre-commit hook script
 * Checks if AI model selection exists and is recent (within last 30 minutes)
 * Automatically prompts for selection if missing or stale
 */

import { existsSync, statSync, readFileSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'bun'

const AI_MODEL_FILE = join(import.meta.dir, '..', '.ai-model')
const SELECT_SCRIPT = join(import.meta.dir, 'select-ai-model.ts')
const MAX_AGE_MINUTES = 30

async function runSelectModel(): Promise<boolean> {
  console.log('\x1b[36m→ Launching AI model selection...\x1b[0m\n')

  const result = spawnSync({
    cmd: ['bun', 'run', SELECT_SCRIPT],
    stdio: ['inherit', 'inherit', 'inherit'],
  })

  return result.exitCode === 0
}

async function main() {
  const needsSelection =
    !existsSync(AI_MODEL_FILE) ||
    (Date.now() - statSync(AI_MODEL_FILE).mtimeMs) / 1000 / 60 > MAX_AGE_MINUTES

  if (needsSelection) {
    if (!existsSync(AI_MODEL_FILE)) {
      console.log('\x1b[33m⚠ No AI model selected.\x1b[0m')
    } else {
      const ageMinutes =
        (Date.now() - statSync(AI_MODEL_FILE).mtimeMs) / 1000 / 60
      console.log(
        `\x1b[33m⚠ AI model selection is stale (${Math.round(ageMinutes)} min ago).\x1b[0m`,
      )
    }

    const success = await runSelectModel()
    if (!success) {
      console.error('\x1b[31m✖ Model selection failed or cancelled.\x1b[0m')
      process.exit(1)
    }
  }

  const model = readFileSync(AI_MODEL_FILE, 'utf-8').trim()
  console.log(`\x1b[32m✔ AI Model: ${model}\x1b[0m`)
}

main()
