import { IValidator } from '../types/interfaces.js'
import {
  PropertyDefinition,
  PropertyType,
  ValidationRule,
} from '../types/manifest.js'

export class EntityValidator implements IValidator {
  private properties: PropertyDefinition[]
  private errors: string[] = []

  constructor(properties: PropertyDefinition[]) {
    this.properties = properties
  }

  validate(data: any): boolean {
    this.errors = []

    for (const property of this.properties) {
      const value = data[property.name]
      this.validateProperty(property, value)
    }

    return this.errors.length === 0
  }

  getErrors(): string[] {
    return [...this.errors]
  }

  private validateProperty(property: PropertyDefinition, value: any): void {
    const { name, type, validation } = property

    if (value === undefined || value === null) {
      if (validation?.required) {
        this.errors.push(`${name} is required`)
      }
      return
    }

    if (!this.validateType(value, type)) {
      this.errors.push(`${name} must be of type ${type}`)
      return
    }

    if (validation) {
      this.validateRules(name, value, validation, type)
    }
  }

  private validateType(value: any, type: PropertyType): boolean {
    switch (type) {
      case 'string':
      case 'text':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'email':
        return typeof value === 'string' && this.isValidEmail(value)
      case 'date':
        return (
          value instanceof Date ||
          (typeof value === 'string' && !isNaN(Date.parse(value)))
        )
      case 'uuid':
        return typeof value === 'string' && this.isValidUUID(value)
      default:
        return true
    }
  }

  private validateRules(
    name: string,
    value: any,
    validation: ValidationRule,
    type: PropertyType,
  ): void {
    if (
      validation.maxLength &&
      typeof value === 'string' &&
      value.length > validation.maxLength
    ) {
      this.errors.push(
        `${name} must not exceed ${validation.maxLength} characters`,
      )
    }

    if (
      validation.minLength &&
      typeof value === 'string' &&
      value.length < validation.minLength
    ) {
      this.errors.push(
        `${name} must be at least ${validation.minLength} characters`,
      )
    }

    if (
      validation.min !== undefined &&
      typeof value === 'number' &&
      value < validation.min
    ) {
      this.errors.push(`${name} must be at least ${validation.min}`)
    }

    if (
      validation.max !== undefined &&
      typeof value === 'number' &&
      value > validation.max
    ) {
      this.errors.push(`${name} must not exceed ${validation.max}`)
    }

    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        this.errors.push(`${name} does not match the required pattern`)
      }
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }
}

export class ValidationService {
  static createValidator(properties: PropertyDefinition[]): IValidator {
    return new EntityValidator(properties)
  }

  static validateValue(
    value: any,
    type: PropertyType,
    rules?: ValidationRule,
  ): { isValid: boolean; errors: string[] } {
    const validator = new EntityValidator([
      {
        name: 'test',
        type,
        validation: rules,
      },
    ])

    const isValid = validator.validate({ test: value })
    const errors = validator
      .getErrors()
      .map((error) => error.replace('test ', ''))

    return { isValid, errors }
  }
}
