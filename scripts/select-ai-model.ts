#!/usr/bin/env bun
/**
 * CLI prompt for selecting AI model before commit
 * Run with: bun run scripts/select-ai-model.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import * as p from '@clack/prompts'

const AI_MODELS = [
  { value: 'Claude Opus 4.5', label: 'Claude Opus 4.5' },
  { value: 'Claude Sonnet 4', label: 'Claude Sonnet 4' },
  { value: 'GPT-4.1', label: 'GPT-4.1' },
  { value: 'GPT-4o', label: 'GPT-4o' },
  { value: 'Gemini 2.5 Pro', label: 'Gemini 2.5 Pro' },
  { value: 'o3', label: 'o3' },
  { value: 'None (manual)', label: 'None (manual)', hint: 'No AI assistance' },
] as const

const OUTPUT_FILE = join(import.meta.dir, '..', '.ai-model')

async function main() {
  p.intro('Select AI Model for this commit')

  const model = await p.select({
    message: 'Which AI model are you using?',
    options: [...AI_MODELS],
  })

  if (p.isCancel(model)) {
    p.cancel('Selection cancelled')
    process.exit(1)
  }

  writeFileSync(OUTPUT_FILE, model + '\n', 'utf-8')

  p.outro(`Selected: ${model}`)
}

main()
