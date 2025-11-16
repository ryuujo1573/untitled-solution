export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'email'
  | 'text'
  | 'date'
  | 'uuid'

export interface ValidationRule {
  required?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  min?: number
  max?: number
}

export interface PropertyDefinition {
  name: string
  type: PropertyType
  validation?: ValidationRule
}

export interface PolicyRule {
  access: 'public' | 'private' | 'admin'
}

export interface EntityPolicies {
  create?: PolicyRule[]
  read?: PolicyRule[]
  update?: PolicyRule[]
  delete?: PolicyRule[]
}

export interface MiddlewareDefinition {
  handler: string
}

export interface EntityMiddlewares {
  beforeCreate?: MiddlewareDefinition[]
  afterCreate?: MiddlewareDefinition[]
  beforeUpdate?: MiddlewareDefinition[]
  afterUpdate?: MiddlewareDefinition[]
  beforeDelete?: MiddlewareDefinition[]
  afterDelete?: MiddlewareDefinition[]
}

export interface EntityDefinition {
  properties: PropertyDefinition[]
  policies?: EntityPolicies
  middlewares?: EntityMiddlewares
}

export interface ManifestDefinition {
  name: string
  entities: Record<string, EntityDefinition>
}

export interface EntityInstance {
  id?: string
  [key: string]: any
}

export interface ValidationError {
  field: string
  message: string
  value?: unknown
}
