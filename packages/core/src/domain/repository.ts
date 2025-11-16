import { IRepository, IEntity } from '../types/interfaces.js'
import { EntityInstance, PropertyDefinition } from '../types/manifest.js'
import { BaseEntity } from './entity.js'
import { IDGenerator, defaultIDGenerator } from '../utils/id-generator.js'

export abstract class BaseRepository<T extends EntityInstance = EntityInstance>
  implements IRepository<T>
{
  protected entities: Map<string, IEntity<T>> = new Map()
  protected entityName: string
  protected properties: PropertyDefinition[]
  protected idGenerator: IDGenerator

  constructor(
    entityName: string,
    properties: PropertyDefinition[],
    idGenerator: IDGenerator = defaultIDGenerator,
  ) {
    this.entityName = entityName
    this.properties = properties
    this.idGenerator = idGenerator
  }

  async create(entityData: Omit<T, 'id'>): Promise<IEntity<T>> {
    const entity = new BaseEntity(
      this.entityName,
      this.properties,
      entityData,
      undefined,
      this.idGenerator,
    )

    if (!entity.isValid()) {
      throw new Error(
        `Entity validation failed: ${entity.getValidationErrors().join(', ')}`,
      )
    }

    this.entities.set(entity.id!, entity)
    return entity
  }

  async findById(id: string): Promise<IEntity<T> | null> {
    return this.entities.get(id) || null
  }

  async findMany(filter?: Partial<T>): Promise<IEntity<T>[]> {
    const entities = Array.from(this.entities.values())

    if (!filter) {
      return entities
    }

    return entities.filter((entity) => {
      const data = entity.toJSON()
      return this.matchesFilter(data, filter)
    })
  }

  async update(id: string, updates: Partial<T>): Promise<IEntity<T>> {
    const entity = this.entities.get(id)

    if (!entity) {
      throw new Error(`Entity with id ${id} not found`)
    }

    // Cast to BaseEntity to access update method
    ;(entity as any).update(updates)

    if (!entity.isValid()) {
      throw new Error(
        `Entity validation failed after update: ${entity.getValidationErrors().join(', ')}`,
      )
    }

    return entity
  }

  async delete(id: string): Promise<boolean> {
    return this.entities.delete(id)
  }

  async count(filter?: Partial<T>): Promise<number> {
    const entities = await this.findMany(filter)
    return entities.length
  }

  async findAll(): Promise<IEntity<T>[]> {
    return Array.from(this.entities.values())
  }

  async exists(id: string): Promise<boolean> {
    return this.entities.has(id)
  }

  protected matchesFilter(data: T, filter: Partial<T>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      const dataValue = (data as any)[key]

      if (typeof value === 'string' && typeof dataValue === 'string') {
        return dataValue.toLowerCase().includes(value.toLowerCase())
      }

      return dataValue === value
    })
  }

  clear(): void {
    this.entities.clear()
  }

  size(): number {
    return this.entities.size
  }
}
