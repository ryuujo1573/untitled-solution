import { IEntity, IRepository } from '../types/interfaces.js'
import {
  EntityInstance,
  EntityDefinition,
  ManifestDefinition,
} from '../types/manifest.js'
import { BaseEntity } from '../domain/entity.js'
import { BaseRepository } from '../domain/repository.js'
import { IDGenerator, defaultIDGenerator } from '../utils/id-generator.js'

export class EntityFactory {
  private manifest: ManifestDefinition
  private idGenerator: IDGenerator

  constructor(
    manifest: ManifestDefinition,
    idGenerator: IDGenerator = defaultIDGenerator,
  ) {
    this.manifest = manifest
    this.idGenerator = idGenerator
  }

  createEntity<T extends EntityInstance = EntityInstance>(
    entityName: string,
    data: Omit<T, 'id'>,
    id?: string,
  ): IEntity<T> {
    const entityDefinition = this.manifest.entities[entityName]

    if (!entityDefinition) {
      throw new Error(`Entity ${entityName} not found in manifest`)
    }

    return new BaseEntity<T>(
      entityName,
      entityDefinition.properties,
      data,
      id,
      this.idGenerator,
    ) as IEntity<T>
  }

  createRepository<T extends EntityInstance = EntityInstance>(
    entityName: string,
  ): IRepository<T> {
    const entityDefinition = this.manifest.entities[entityName]

    if (!entityDefinition) {
      throw new Error(`Entity ${entityName} not found in manifest`)
    }

    return new ManifestRepository<T>(
      entityName,
      entityDefinition.properties,
      this.idGenerator,
    )
  }

  getEntityDefinition(entityName: string): EntityDefinition | undefined {
    return this.manifest.entities[entityName]
  }

  getEntityNames(): string[] {
    return Object.keys(this.manifest.entities)
  }

  hasEntity(entityName: string): boolean {
    return entityName in this.manifest.entities
  }

  getManifest(): ManifestDefinition {
    return this.manifest
  }
}

class ManifestRepository<
  T extends EntityInstance = EntityInstance,
> extends BaseRepository<T> {
  constructor(entityName: string, properties: any[], idGenerator: IDGenerator) {
    super(entityName, properties, idGenerator)
  }
}

export class EntityManager {
  private factories = new Map<string, EntityFactory>()
  private repositories = new Map<string, IRepository<any>>()

  registerFactory(name: string, factory: EntityFactory): void {
    this.factories.set(name, factory)
  }

  getFactory(name: string): EntityFactory | undefined {
    return this.factories.get(name)
  }

  getRepository<T extends EntityInstance = EntityInstance>(
    factoryName: string,
    entityName: string,
  ): IRepository<T> {
    const key = `${factoryName}:${entityName}`

    if (!this.repositories.has(key)) {
      const factory = this.factories.get(factoryName)
      if (!factory) {
        throw new Error(`Factory ${factoryName} not found`)
      }

      const repository = factory.createRepository<T>(entityName)
      this.repositories.set(key, repository)
    }

    return this.repositories.get(key) as IRepository<T>
  }

  createEntity<T extends EntityInstance = EntityInstance>(
    factoryName: string,
    entityName: string,
    data: Omit<T, 'id'>,
    id?: string,
  ): IEntity<T> {
    const factory = this.factories.get(factoryName)
    if (!factory) {
      throw new Error(`Factory ${factoryName} not found`)
    }

    return factory.createEntity<T>(entityName, data, id)
  }

  getAvailableEntities(factoryName: string): string[] {
    const factory = this.factories.get(factoryName)
    return factory ? factory.getEntityNames() : []
  }

  clear(): void {
    this.factories.clear()
    this.repositories.clear()
  }
}
