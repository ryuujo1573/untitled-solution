import { customAlphabet, nanoid } from 'nanoid'

export interface IDGenerator {
  generate(): string
  isValid(id: string): boolean
}

export class NanoIDGenerator implements IDGenerator {
  private alphabet: string
  private size: number

  constructor(options?: { alphabet?: string; size?: number }) {
    this.alphabet =
      options?.alphabet ||
      '_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    this.size = options?.size || 12
  }

  generate(): string {
    const customNanoid = customAlphabet(this.alphabet, this.size)
    return customNanoid()
  }

  isValid(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false
    }

    if (id.length !== this.size) {
      return false
    }

    return id.split('').every((char) => this.alphabet.includes(char))
  }

  static create(options?: {
    alphabet?: string
    size?: number
  }): NanoIDGenerator {
    return new NanoIDGenerator(options)
  }
}

export class ReadableIDGenerator implements IDGenerator {
  private adjectives: string[]
  private nouns: string[]
  private separator: string
  private useNumbers: boolean

  constructor(options?: { separator?: string; useNumbers?: boolean }) {
    this.separator = options?.separator || '_'
    this.useNumbers = options?.useNumbers ?? true

    this.adjectives = [
      'quick',
      'lazy',
      'sleepy',
      'noisy',
      'hungry',
      'happy',
      'sad',
      'angry',
      'bright',
      'dark',
      'fast',
      'slow',
      'big',
      'small',
      'hot',
      'cold',
      'new',
      'old',
      'young',
      'wise',
      'brave',
      'calm',
      'clever',
      'cool',
      'crazy',
      'eager',
      'fair',
      'fancy',
      'free',
      'fresh',
      'gentle',
      'giant',
      'great',
      'happy',
      'heavy',
      'honest',
      'huge',
      'kind',
      'large',
      'light',
      'lucky',
      'magic',
      'modern',
      'nice',
      'proud',
      'quiet',
      'rare',
      'real',
      'rich',
      'safe',
    ]

    this.nouns = [
      'apple',
      'banana',
      'orange',
      'grape',
      'lemon',
      'peach',
      'berry',
      'melon',
      'cherry',
      'plum',
      'dog',
      'cat',
      'bird',
      'fish',
      'bear',
      'lion',
      'tiger',
      'wolf',
      'fox',
      'deer',
      'car',
      'bike',
      'train',
      'plane',
      'boat',
      'bus',
      'truck',
      'ship',
      'rocket',
      'subway',
      'book',
      'pen',
      'paper',
      'phone',
      'laptop',
      'mouse',
      'keyboard',
      'screen',
      'camera',
      'speaker',
      'house',
      'room',
      'door',
      'window',
      'garden',
      'kitchen',
      'bedroom',
      'bathroom',
      'office',
      'garage',
    ]
  }

  generate(): string {
    const adjective = this.getRandomElement(this.adjectives)
    const noun = this.getRandomElement(this.nouns)
    const number = this.useNumbers ? Math.floor(Math.random() * 9999) : ''

    const parts = [adjective, noun]
    if (number) parts.push(number.toString())

    return parts.join(this.separator)
  }

  isValid(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false
    }

    const parts = id.split(this.separator)
    const expectedParts = this.useNumbers ? 3 : 2

    if (parts.length !== expectedParts) {
      return false
    }

    const [adjective, noun, number] = parts

    if (!this.adjectives.includes(adjective) || !this.nouns.includes(noun)) {
      return false
    }

    if (this.useNumbers && (!number || !/^\d+$/.test(number))) {
      return false
    }

    return true
  }

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  static create(options?: {
    separator?: string
    useNumbers?: boolean
  }): ReadableIDGenerator {
    return new ReadableIDGenerator(options)
  }
}

export class TimestampIDGenerator implements IDGenerator {
  private prefix: string
  private useNanoID: boolean

  constructor(options?: { prefix?: string; useNanoID?: boolean }) {
    this.prefix = options?.prefix || ''
    this.useNanoID = options?.useNanoID ?? true
  }

  generate(): string {
    const timestamp = Date.now().toString(36)
    const randomPart = this.useNanoID
      ? nanoid(6)
      : Math.random().toString(36).substring(2, 8)

    const parts = [timestamp, randomPart]
    if (this.prefix) parts.unshift(this.prefix)

    return parts.join('_')
  }

  isValid(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false
    }

    const parts = id.split('_')
    const expectedParts = this.prefix ? 3 : 2

    if (parts.length !== expectedParts) {
      return false
    }

    const [prefixOrTimestamp, timestamp, randomPart] = this.prefix
      ? parts
      : ['', ...parts]

    const actualTimestamp = this.prefix ? timestamp : prefixOrTimestamp
    const actualRandomPart = this.prefix ? randomPart : timestamp

    if (!/^[a-z0-9]+$/i.test(actualTimestamp)) {
      return false
    }

    if (!/^[a-z0-9_-]+$/i.test(actualRandomPart)) {
      return false
    }

    return true
  }

  static create(options?: {
    prefix?: string
    useNanoID?: boolean
  }): TimestampIDGenerator {
    return new TimestampIDGenerator(options)
  }
}

export enum IDType {
  NANO = 'nano',
  READABLE = 'readable',
  TIMESTAMP = 'timestamp',
}

export class IDGeneratorFactory {
  static create(type: IDType, options?: any): IDGenerator {
    switch (type) {
      case IDType.NANO:
        return NanoIDGenerator.create(options)
      case IDType.READABLE:
        return ReadableIDGenerator.create(options)
      case IDType.TIMESTAMP:
        return TimestampIDGenerator.create(options)
      default:
        throw new Error(`Unknown ID type: ${type}`)
    }
  }

  static createNanoID(options?: {
    alphabet?: string
    size?: number
  }): NanoIDGenerator {
    return NanoIDGenerator.create(options)
  }

  static createReadableID(options?: {
    separator?: string
    useNumbers?: boolean
  }): ReadableIDGenerator {
    return ReadableIDGenerator.create(options)
  }

  static createTimestampID(options?: {
    prefix?: string
    useNanoID?: boolean
  }): TimestampIDGenerator {
    return TimestampIDGenerator.create(options)
  }
}

export const defaultIDGenerator = new NanoIDGenerator({ size: 12 })

export function generateID(): string {
  return defaultIDGenerator.generate()
}

export function isValidID(id: string): boolean {
  return defaultIDGenerator.isValid(id)
}
