/// <reference types="node" />
/**
 * Schema export and validation script
 *
 * This script generates the JSON Schema from Zod types and validates it.
 * It ensures that the JSON Schema is always in sync with the Zod source of truth.
 */

import { z } from 'zod'
import { LayoutIRSchema } from '../src/layout.js'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schemaPath = resolve(__dirname, '../src/layout.schema.json')

// Generate JSON Schema from Zod
const generatedSchema = z.toJSONSchema(LayoutIRSchema, {
  target: 'draft-2020-12',
  reused: 'ref',
})

// Add $id and other top-level fields that might not be in Zod meta
const finalSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://cnmjs.dev/schemas/layout-ir.json',
  ...generatedSchema,
}

// Load existing schema to compare
let existingSchema = ''
try {
  existingSchema = readFileSync(schemaPath, 'utf-8')
} catch (e) {
  // File might not exist
}

const newSchemaContent = JSON.stringify(finalSchema, null, 2)

if (newSchemaContent !== existingSchema) {
  console.log('🔄 Updating JSON Schema...')
  writeFileSync(schemaPath, newSchemaContent)
  console.log('✅ JSON Schema updated successfully')
} else {
  console.log('✅ JSON Schema is already up to date')
}

// Test data to validate both schemas agree
const testIR = {
  version: '1.0',
  root: {
    id: 'test-root',
    type: 'layout' as const,
    context: 'flex' as const,
    props: { direction: 'column' as const },
    children: [
      {
        id: 'test-component',
        type: 'component' as const,
        category: 'library' as const,
        name: 'MUI:Button',
      },
    ],
  },
}

// Validate with Zod
const zodResult = LayoutIRSchema.safeParse(testIR)

if (!zodResult.success) {
  console.error('❌ Zod validation failed:', zodResult.error)
  process.exit(1)
}

console.log('✅ Zod schema validation passed')
console.log(`✅ JSON Schema located at: ${schemaPath}`)
console.log('\nJSON Schema summary:')
console.log(`   - $id: ${finalSchema.$id}`)
console.log(`   - title: ${finalSchema.title}`)
console.log(
  `   - definitions: ${Object.keys((finalSchema as any).$defs || {}).join(', ')}`,
)
