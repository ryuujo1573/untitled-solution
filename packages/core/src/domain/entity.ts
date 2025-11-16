import { IEntity, IValidator } from '../types/interfaces'
import { EntityInstance, PropertyDefinition } from '../types/manifest'
import { EntityValidator } from './validator'
import { IDGenerator, defaultIDGenerator } from '../utils/id-generator'

export class BaseEntity<T extends EntityInstance = EntityInstance>
  implements IEntity<T>
{
  public id?: string
  public data: T
  private validator: IValidator
  private entityName: string
  private properties: PropertyDefinition[]

  constructor(
    entityName: string,
    properties: PropertyDefinition[],
    data: Omit<T, 'id'>,
    id?: string,
    idGenerator: IDGenerator = defaultIDGenerator,
  ) {
    this.entityName = entityName
    this.properties = properties
    this.validator = new EntityValidator(properties)
    this.data = { ...data } as T

    if (id) {
      this.id = id
    } else {
      this.id = idGenerator.generate()
    }
  }

  isValid(): boolean {
    return this.validator.validate(this.data)
  }

  getValidationErrors(): string[] {
    return this.validator.getErrors()
  }

  update(updates: Partial<T>): void {
    this.data = { ...this.data, ...updates }
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key]
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.data[key] = value
  }

  toJSON(): T {
    return {
      ...this.data,
      ...(this.id && { id: this.id }),
    }
  }

  toPlainObject(): Record<string, any> {
    return this.toJSON()
  }

  clone(): BaseEntity<T> {
    return new BaseEntity(
      this.entityName,
      this.properties,
      { ...this.data },
      this.id,
      defaultIDGenerator,
    )
  }

  equals(other: IEntity<T>): boolean {
    if (!this.id || !other.id) {
      return false
    }

    return this.id === other.id && this.entityName === (other as any).entityName
  }

  getEntityName(): string {
    return this.entityName
  }

  getProperties(): PropertyDefinition[] {
    return this.properties
  }
}
