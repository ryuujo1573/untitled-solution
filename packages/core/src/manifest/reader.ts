import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import {
  ManifestDefinition,
  PropertyDefinition,
  ValidationRule,
} from '../types/manifest.js'

export class ManifestReader {
  private cache = new Map<string, ManifestDefinition>()

  async readManifest(filePath: string): Promise<ManifestDefinition> {
    const absolutePath = resolve(filePath)

    if (this.cache.has(absolutePath)) {
      return this.cache.get(absolutePath)!
    }

    try {
      const fileContent = readFileSync(absolutePath, 'utf-8')
      const yamlData = parseYaml(fileContent)

      const manifest = this.validateAndTransformManifest(yamlData)
      this.cache.set(absolutePath, manifest)

      return manifest
    } catch (error) {
      throw new Error(
        `Failed to read manifest from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  private validateAndTransformManifest(data: any): ManifestDefinition {
    if (!data || typeof data !== 'object') {
      throw new Error('Manifest must be a valid object')
    }

    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Manifest must have a name property')
    }

    if (!data.entities || typeof data.entities !== 'object') {
      throw new Error('Manifest must have an entities object')
    }

    const manifest: ManifestDefinition = {
      name: data.name,
      entities: {},
    }

    for (const [entityName, entityData] of Object.entries(data.entities)) {
      if (!entityData || typeof entityData !== 'object') {
        throw new Error(`Entity ${entityName} must be a valid object`)
      }

      manifest.entities[entityName] = this.validateAndTransformEntity(
        entityData as any,
      )
    }

    return manifest
  }

  private validateAndTransformEntity(entityData: any): any {
    const result: any = {
      properties: [],
      policies: entityData.policies || {},
      middlewares: entityData.middlewares || {},
    }

    if (!entityData.properties || !Array.isArray(entityData.properties)) {
      throw new Error('Entity must have a properties array')
    }

    for (const prop of entityData.properties) {
      if (!prop.name || typeof prop.name !== 'string') {
        throw new Error('Property must have a name')
      }

      if (!prop.type || typeof prop.type !== 'string') {
        throw new Error(`Property ${prop.name} must have a type`)
      }

      const property: PropertyDefinition = {
        name: prop.name,
        type: prop.type as any,
        validation: prop.validation || undefined,
      }

      result.properties.push(property)
    }

    return result
  }

  clearCache(): void {
    this.cache.clear()
  }

  getFromCache(filePath: string): ManifestDefinition | undefined {
    return this.cache.get(resolve(filePath))
  }
}
