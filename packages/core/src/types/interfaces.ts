import { EntityInstance } from './manifest'

export interface IEntity<T extends EntityInstance = EntityInstance> {
  id?: string
  data: T
  isValid(): boolean
  getValidationErrors(): string[]
  toJSON(): T
}

export interface IRepository<T extends EntityInstance = EntityInstance> {
  create(entityData: Omit<T, 'id'>): Promise<IEntity<T>>
  findById(id: string): Promise<IEntity<T> | null>
  findMany(filter?: Partial<T>): Promise<IEntity<T>[]>
  update(id: string, updates: Partial<T>): Promise<IEntity<T>>
  delete(id: string): Promise<boolean>
  count(filter?: Partial<T>): Promise<number>
}

export interface IEntityManager {
  getRepository<T extends EntityInstance>(entityName: string): IRepository<T>
  createEntity<T extends EntityInstance>(
    entityName: string,
    data: Omit<T, 'id'>,
  ): IEntity<T>
}

export interface IValidator {
  validate(value: any): boolean
  getErrors(): string[]
}

export interface IMiddleware {
  name: string
  execute(context: any): Promise<void>
}

export interface IMiddlewareRegistry {
  register(middleware: IMiddleware): void
  get(name: string): IMiddleware | undefined
  execute(name: string, context: any): Promise<void>
}
