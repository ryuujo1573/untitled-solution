import {
  createManifestProcessor,
  createManifestBuilder,
  NanoIDGenerator,
  ReadableIDGenerator,
  TimestampIDGenerator,
  IDGeneratorFactory,
  IDType,
} from './index.js'

async function basicExample() {
  const processor = createManifestProcessor()

  await processor.loadManifest('./manifest/demo.yml', 'demo')

  const contactRepo = processor.getRepository('demo', 'Contact')

  const newContact = await contactRepo.create({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    message: 'Hello, this is a test message!',
  })

  console.log('Created contact:', newContact.toJSON())
  console.log('Is valid:', newContact.isValid())

  const foundContact = await contactRepo.findById(newContact.id!)
  console.log('Found contact:', foundContact?.toJSON())

  const allContacts = await contactRepo.findMany({ firstName: 'John' })
  console.log('Found contacts with firstName John:', allContacts.length)
}

async function builderExample() {
  console.log('\n=== Builder Pattern Example ===')

  const processor = (
    await createManifestBuilder().addManifest('./manifest/demo.yml', 'demo')
  ).build()

  const contactRepo = processor.getRepository('demo', 'Contact')

  const validation = processor.validateEntity('demo', 'Contact', {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'invalid-email',
  })

  console.log('Validation result:', validation)

  const contact = await contactRepo.create({
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    message: 'Another test message',
  })
  console.log('Created contact:', contact.toJSON())
}

async function factoryExample() {
  console.log('\n=== Factory Pattern Example ===')

  const processor = createManifestProcessor()
  await processor.loadManifest('./manifest/demo.yml', 'demo')

  const factory = processor.getFactory('demo')
  if (factory) {
    console.log('Available entities:', factory.getEntityNames())

    const contactEntity = factory.createEntity('Contact', {
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@example.com',
      message: 'Factory created entity',
    })

    console.log('Entity from factory:', contactEntity.toJSON())
    console.log(
      'Entity name:',
      (contactEntity as any).getEntityName?.() || 'Contact',
    )
    console.log(
      'Entity properties:',
      (contactEntity as any).getProperties?.()?.map((p: any) => p.name) || [
        'No properties',
      ],
    )
  }
}

async function repositoryExample() {
  console.log('\n=== Repository Operations Example ===')

  const processor = createManifestProcessor()
  await processor.loadManifest('./manifest/demo.yml', 'demo')

  const repo = processor.getRepository('demo', 'Contact')

  const contacts = [
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      message: 'Message 1',
    },
    {
      firstName: 'Bob',
      lastName: 'Brown',
      email: 'bob@example.com',
      message: 'Message 2',
    },
    {
      firstName: 'Charlie',
      lastName: 'Davis',
      email: 'charlie@example.com',
      message: 'Message 3',
    },
  ]

  const createdContacts = await Promise.all(
    contacts.map((contact) => repo.create(contact)),
  )

  console.log('Created contacts:', createdContacts.length)

  const allContacts = await repo.findMany()
  console.log('All contacts count:', allContacts.length)

  const filteredContacts = await repo.findMany({ firstName: 'Alice' })
  console.log('Contacts named Alice:', filteredContacts.length)

  const totalCount = await repo.count()
  console.log('Total contacts:', totalCount)

  const firstContact = createdContacts[0]
  if (firstContact.id) {
    await repo.update(firstContact.id, { message: 'Updated message' })
    const updatedContact = await repo.findById(firstContact.id)
    console.log('Updated contact message:', updatedContact?.toJSON().message)
  }
}

async function nanoIDExample() {
  console.log('\n=== Nano ID Generator Example ===')

  const nanoGenerator = NanoIDGenerator.create({
    alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    size: 10,
  })

  const processor = createManifestProcessor(nanoGenerator)
  await processor.loadManifest('./manifest/demo.yml', 'nano-demo')

  const contactRepo = processor.getRepository('nano-demo', 'Contact')

  const contact = await contactRepo.create({
    firstName: 'Nano',
    lastName: 'User',
    email: 'nano@example.com',
    message: 'Generated with NanoID!',
  })

  console.log('NanoID contact ID:', contact.id)
  console.log('NanoID contact:', contact.toJSON())
  console.log('Is valid NanoID:', nanoGenerator.isValid(contact.id!))
}

async function readableIDExample() {
  console.log('\n=== Readable ID Generator Example ===')

  const readableGenerator = ReadableIDGenerator.create({
    separator: '_',
    useNumbers: true,
  })

  const processor = createManifestProcessor(readableGenerator)
  await processor.loadManifest('./manifest/demo.yml', 'readable-demo')

  const contactRepo = processor.getRepository('readable-demo', 'Contact')

  const contact = await contactRepo.create({
    firstName: 'Readable',
    lastName: 'User',
    email: 'readable@example.com',
    message: 'Generated with readable ID!',
  })

  console.log('Readable contact ID:', contact.id)
  console.log('Readable contact:', contact.toJSON())
  console.log('Is valid readable ID:', readableGenerator.isValid(contact.id!))
}

async function timestampIDExample() {
  console.log('\n=== Timestamp ID Generator Example ===')

  const timestampGenerator = TimestampIDGenerator.create({
    prefix: 'contact',
    useNanoID: true,
  })

  const processor = createManifestProcessor(timestampGenerator)
  await processor.loadManifest('./manifest/demo.yml', 'timestamp-demo')

  const contactRepo = processor.getRepository('timestamp-demo', 'Contact')

  const contact = await contactRepo.create({
    firstName: 'Timestamp',
    lastName: 'User',
    email: 'timestamp@example.com',
    message: 'Generated with timestamp ID!',
  })

  console.log('Timestamp contact ID:', contact.id)
  console.log('Timestamp contact:', contact.toJSON())
  console.log('Is valid timestamp ID:', timestampGenerator.isValid(contact.id!))
}

async function factoryIDExample() {
  console.log('\n=== ID Generator Factory Example ===')

  const idTypeNames = ['NANO', 'READABLE', 'TIMESTAMP'] as const
  const generators = [
    IDGeneratorFactory.create(IDType.NANO, { size: 8 }),
    IDGeneratorFactory.create(IDType.READABLE, {
      separator: '-',
      useNumbers: false,
    }),
    IDGeneratorFactory.create(IDType.TIMESTAMP, {
      prefix: 'user',
      useNanoID: false,
    }),
  ]

  for (let i = 0; i < generators.length; i++) {
    const generator = generators[i]
    const processor = createManifestProcessor(generator)
    await processor.loadManifest('./manifest/demo.yml', `factory-demo-${i}`)

    const contactRepo = processor.getRepository(`factory-demo-${i}`, 'Contact')
    const contact = await contactRepo.create({
      firstName: `Factory${i + 1}`,
      lastName: 'User',
      email: `factory${i + 1}@example.com`,
      message: `Generated with ${idTypeNames[i]} ID!`,
    })

    console.log(`${idTypeNames[i]} ID:`, contact.id)
    console.log(`${idTypeNames[i]} valid:`, generator.isValid(contact.id!))
  }
}

export async function runAllExamples() {
  try {
    await basicExample()
    await builderExample()
    await factoryExample()
    await repositoryExample()
    await nanoIDExample()
    await readableIDExample()
    await timestampIDExample()
    await factoryIDExample()
  } catch (error) {
    console.error('Error running examples:', error)
  }
}

runAllExamples()
