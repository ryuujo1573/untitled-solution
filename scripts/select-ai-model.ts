#!/usr/bin/env bun
/**
 * CLI prompt for selecting AI model before commit
 * Run with: bun run scripts/select-ai-model.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'
import * as p from '@clack/prompts'
import AI_CONFIG from './ai-models.json'

const OUTPUT_FILE = join(import.meta.dir, '..', '.ai-model')

async function main() {
  p.intro('Select AI Model for this commit')

  const options = Object.values(AI_CONFIG).flatMap((s: any) => s.models)

  const model = await p.select({
    message: 'Which AI model are you using?',
    options: options as any,
  })

  if (p.isCancel(model)) {
    p.cancel('Selection cancelled')
    process.exit(1)
  }

  writeFileSync(OUTPUT_FILE, model + '\n', 'utf-8')

  p.outro(`Selected: ${model}`)
}

main()
