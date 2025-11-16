import { ManifestReader } from './manifest/reader.js'
import { EntityFactory, EntityManager } from './factory/entity-factory.js'
import { ManifestDefinition } from './types/manifest.js'
import { IRepository, IEntity, IEntityManager } from './types/interfaces.js'
import {
  IDGenerator,
  NanoIDGenerator,
  ReadableIDGenerator,
  TimestampIDGenerator,
  IDGeneratorFactory,
  IDType,
  defaultIDGenerator,
  generateID,
  isValidID,
} from './utils/id-generator.js'

export class ManifestProcessor {
  private manifestReader: ManifestReader
  private entityManager: EntityManager
  private factories = new Map<string, EntityFactory>()
  private idGenerator: IDGenerator

  constructor(idGenerator: IDGenerator = defaultIDGenerator) {
    this.manifestReader = new ManifestReader()
    this.entityManager = new EntityManager()
    this.idGenerator = idGenerator
  }

  async loadManifest(filePath: string, factoryName?: string): Promise<void> {
    const manifest = await this.manifestReader.readManifest(filePath)
    const factory = new EntityFactory(manifest, this.idGenerator)

    const name = factoryName || manifest.name.replace(/\s+/g, '-').toLowerCase()

    this.factories.set(name, factory)
    this.entityManager.registerFactory(name, factory)
  }

  async loadManifests(manifestPaths: Record<string, string>): Promise<void> {
    for (const [factoryName, filePath] of Object.entries(manifestPaths)) {
      await this.loadManifest(filePath, factoryName)
    }
  }

  getRepository<T extends Record<string, any> = Record<string, any>>(
    factoryName: string,
    entityName: string,
  ): IRepository<T> {
    return this.entityManager.getRepository<T>(factoryName, entityName)
  }

  createEntity<T extends Record<string, any> = Record<string, any>>(
    factoryName: string,
    entityName: string,
    data: Omit<T, 'id'>,
    id?: string,
  ): IEntity<T> {
    return this.entityManager.createEntity<T>(factoryName, entityName, data, id)
  }

  getFactory(factoryName: string): EntityFactory | undefined {
    return this.factories.get(factoryName)
  }

  getAvailableFactories(): string[] {
    return Array.from(this.factories.keys())
  }

  getAvailableEntities(factoryName: string): string[] {
    return this.entityManager.getAvailableEntities(factoryName)
  }

  getManifest(factoryName: string): ManifestDefinition | undefined {
    const factory = this.factories.get(factoryName)
    return factory?.getManifest()
  }

  clearCache(): void {
    this.manifestReader.clearCache()
    this.factories.clear()
    this.entityManager.clear()
  }

  async reloadManifest(filePath: string, factoryName?: string): Promise<void> {
    this.manifestReader.clearCache()
    await this.loadManifest(filePath, factoryName)
  }

  validateEntity<T extends Record<string, any>>(
    factoryName: string,
    entityName: string,
    data: T,
  ): { isValid: boolean; errors: string[] } {
    const factory = this.factories.get(factoryName)
    if (!factory) {
      throw new Error(`Factory ${factoryName} not found`)
    }

    const entityDefinition = factory.getEntityDefinition(entityName)
    if (!entityDefinition) {
      throw new Error(
        `Entity ${entityName} not found in factory ${factoryName}`,
      )
    }

    try {
      const entity = factory.createEntity<T>(entityName, data)
      return {
        isValid: entity.isValid(),
        errors: entity.getValidationErrors(),
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [
          error instanceof Error ? error.message : 'Unknown validation error',
        ],
      }
    }
  }

  getEntityManager(): IEntityManager {
    return {
      getRepository: <T>(entityName: string) => {
        throw new Error('Use getRepository(factoryName, entityName) instead')
      },
      createEntity: <T>(entityName: string, data: any) => {
        throw new Error(
          'Use createEntity(factoryName, entityName, data) instead',
        )
      },
    }
  }
}

export class ManifestBuilder {
  private processor: ManifestProcessor

  constructor(idGenerator: IDGenerator = defaultIDGenerator) {
    this.processor = new ManifestProcessor(idGenerator)
  }

  static create(idGenerator?: IDGenerator): ManifestBuilder {
    return new ManifestBuilder(idGenerator)
  }

  async addManifest(
    filePath: string,
    factoryName?: string,
  ): Promise<ManifestBuilder> {
    await this.processor.loadManifest(filePath, factoryName)
    return this
  }

  async addManifests(
    manifestPaths: Record<string, string>,
  ): Promise<ManifestBuilder> {
    await this.processor.loadManifests(manifestPaths)
    return this
  }

  build(): ManifestProcessor {
    return this.processor
  }
}

export function createManifestProcessor(
  idGenerator?: IDGenerator,
): ManifestProcessor {
  return new ManifestProcessor(idGenerator)
}

export function createManifestBuilder(
  idGenerator?: IDGenerator,
): ManifestBuilder {
  return ManifestBuilder.create(idGenerator)
}

export {
  NanoIDGenerator,
  ReadableIDGenerator,
  TimestampIDGenerator,
  IDGeneratorFactory,
  IDType,
  defaultIDGenerator,
  generateID,
  isValidID,
}

export type { IDGenerator }
