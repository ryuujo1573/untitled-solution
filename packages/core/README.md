# Entity Repository with DDD Pattern

A TypeScript implementation for reading YAML manifest files and producing a basic entity repository using Domain-Driven Design (DDD) patterns.

## Features

- **YAML Manifest Parsing**: Read and parse entity definitions from YAML files
- **Domain-Driven Design**: Implements core DDD patterns including Entities and Repositories
- **Type Safety**: Full TypeScript support with proper type definitions
- **Validation**: Built-in validation for entity properties based on manifest rules
- **Flexible Repository Pattern**: In-memory repository implementation that can be extended
- **Factory Pattern**: Entity factories for creating entities and repositories from manifests

## Installation

```bash
npm install @cnmjs/core
```

## Quick Start

### 1. Create a Manifest File

```yaml
# manifest/demo.yml
name: Entity Repository

entities:
  Contact:
    properties:
      - { name: firstName, type: string }
      - { name: lastName, type: string, validation: { maxLength: 50 } }
      - { name: email, type: email, validation: { required: true } }
      - { name: message, type: text }
    policies:
      create:
        - access: public
    middlewares:
      beforeCreate:
        - handler: sendEmail
```

### 2. Basic Usage

```typescript
import { createManifestProcessor } from '@cnmjs/core'

async function example() {
  const processor = createManifestProcessor()

  // Load manifest
  await processor.loadManifest('./manifest/demo.yml', 'demo')

  // Get repository for Contact entity
  const contactRepo = processor.getRepository('demo', 'Contact')

  // Create a new contact
  const contact = await contactRepo.create({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    message: 'Hello, World!',
  })

  console.log('Created contact:', contact.toJSON())

  // Find contacts
  const allContacts = await contactRepo.findMany()
  const johns = await contactRepo.findMany({ firstName: 'John' })

  // Update contact
  await contactRepo.update(contact.id!, { message: 'Updated message' })
}
```

### 3. Builder Pattern

```typescript
import { createManifestBuilder } from '@cnmjs/core'

const processor = await createManifestBuilder()
  .addManifest('./manifest/demo.yml', 'demo')
  .addManifest('./manifest/users.yml', 'users')
  .build()
```

## API Reference

### ManifestProcessor

Main class for processing manifests and managing entities.

#### Methods

- `loadManifest(filePath, factoryName?)`: Load a single manifest file
- `loadManifests(manifestPaths)`: Load multiple manifest files
- `getRepository(factoryName, entityName)`: Get repository for an entity
- `createEntity(factoryName, entityName, data, id?)`: Create a new entity
- `validateEntity(factoryName, entityName, data)`: Validate entity data
- `getAvailableFactories()`: Get list of loaded factory names
- `getAvailableEntities(factoryName)`: Get entities for a factory

### Entity Types

#### Property Types

- `string`: Basic string type
- `text`: Long text content
- `number`: Numeric values
- `boolean`: Boolean values
- `email`: Email address format
- `date`: Date values
- `uuid`: UUID format

#### Validation Rules

- `required`: Field must be present
- `maxLength`: Maximum string length
- `minLength`: Minimum string length
- `min`: Minimum number value
- `max`: Maximum number value
- `pattern`: Regex pattern for strings

### Repository Interface

```typescript
interface IRepository<T> {
  create(entityData: Omit<T, 'id'>): Promise<IEntity<T>>
  findById(id: string): Promise<IEntity<T> | null>
  findMany(filter?: Partial<T>): Promise<IEntity<T>[]>
  update(id: string, updates: Partial<T>): Promise<IEntity<T>>
  delete(id: string): Promise<boolean>
  count(filter?: Partial<T>): Promise<number>
}
```

### Entity Interface

```typescript
interface IEntity<T> {
  id?: string
  data: T
  isValid(): boolean
  getValidationErrors(): string[]
  toJSON(): T
}
```

## Advanced Usage

### Custom Repository Implementation

```typescript
import { BaseRepository } from '@cnmjs/core'

class CustomContactRepository extends BaseRepository<Contact> {
  async findByEmail(email: string): Promise<IEntity<Contact> | null> {
    const contacts = await this.findMany({ email })
    return contacts[0] || null
  }

  async findActive(): Promise<IEntity<Contact>[]> {
    return this.findMany({ status: 'active' })
  }
}
```

### Entity Validation

```typescript
const processor = createManifestProcessor()
await processor.loadManifest('./manifest/demo.yml', 'demo')

const validation = processor.validateEntity('demo', 'Contact', {
  firstName: 'John',
  email: 'invalid-email', // Will fail validation
})

if (!validation.isValid) {
  console.log('Validation errors:', validation.errors)
}
```

### Factory Pattern

```typescript
const factory = processor.getFactory('demo')
if (factory) {
  // Create entity without persisting
  const entity = factory.createEntity('Contact', {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
  })

  console.log('Entity valid:', entity.isValid())
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run examples
npm test

# Watch mode for development
npm run dev
```

## Architecture

The implementation follows Domain-Driven Design principles:

- **Entities**: Rich domain objects with identity and validation
- **Repositories**: Collections that manage entity persistence
- **Factories**: Create entities and repositories from manifest definitions
- **Value Objects**: Immutable objects representing domain concepts
- **Domain Services**: Business logic that doesn't naturally fit in entities

## License

MIT License
