import { expect, test, describe } from 'bun:test'
import Ajv from 'ajv'
import yaml from 'js-yaml'
import { readFileSync } from 'fs'
import { join } from 'path'

const schemaPath = join(import.meta.dir, '..', 'domain-manifest.schema.json')
const examplePath = join(import.meta.dir, 'example-manifest.yaml')

const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'))
const example = yaml.load(readFileSync(examplePath, 'utf-8'))

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)

describe('Domain Manifest Schema Validation', () => {
  test('should validate a correct manifest', () => {
    const valid = validate(example)
    if (!valid) {
      console.error(validate.errors)
    }
    expect(valid).toBe(true)
  })

  test('should fail on missing required fields', () => {
    const invalidManifest = {
      entities: {
        InvalidEntity: {
          // missing kind and type
          properties: {
            name: { type: 'string' },
          },
        },
      },
    }
    const valid = validate(invalidManifest)
    expect(valid).toBe(false)
    expect(validate.errors?.some((e) => e.keyword === 'required')).toBe(true)
  })

  test('should fail on invalid enum values', () => {
    const invalidManifest = {
      entities: {
        InvalidEntity: {
          kind: 'not-a-kind',
          type: 'collection',
        },
      },
    }
    const valid = validate(invalidManifest)
    expect(valid).toBe(false)
    expect(validate.errors?.some((e) => e.keyword === 'enum')).toBe(true)
  })

  test('should validate nested group properties', () => {
    const manifestWithGroup = {
      entities: {
        User: {
          kind: 'aggregate-root',
          type: 'collection',
          properties: {
            address: {
              type: 'group',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
            },
          },
        },
      },
    }
    const valid = validate(manifestWithGroup)
    expect(valid).toBe(true)
  })
})
