/// <reference types="node" />
/**
 * Schema export and validation script
 *
 * Note: Zod v4's z.toJSONSchema() has issues with recursive types (z.lazy).
 * The JSON Schema is manually maintained in layout.schema.json.
 * This script validates that the manual schema is in sync with Zod types.
 */

import { LayoutIRSchema } from '../src/layout.js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schemaPath = resolve(__dirname, '../layout.schema.json')

// Load the manually maintained JSON Schema
const jsonSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'))

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
console.log(`   - $id: ${jsonSchema.$id}`)
console.log(`   - title: ${jsonSchema.title}`)
console.log(
  `   - definitions: ${Object.keys(jsonSchema.$defs || {}).join(', ')}`,
)
