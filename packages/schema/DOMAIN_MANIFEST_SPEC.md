# Domain Manifest Specification (DRAFT)

## Overview

The Domain Manifest is a single source of truth for describing a Domain-Driven backend service. This specification serves two primary purposes:

1. **Architectural Blueprint**: To define an ultimate service design based on DDD principles.
2. **Parser/Generator Implementation**: To provide a standard for building tools that parse these manifest files and transform them into functional, production-ready backends.

This SPEC is **not** intended for direct AI generation of specific backend codebases, but rather for the creation of the **engine** that automates that process.

## 1. Entity Modeling & Relationships

### Entity Types

- **Collection**: Multiple instances of data (e.g., `Users`, `Products`). Generates standard CRUD.
- **Single**: A unique, standalone record (e.g., `SiteSettings`). Create/Delete are disabled.
- **Value Object (Group)**: Reusable nested data structures (e.g., `Address`, `Testimonial`).

### Relationship Types

- **belongsTo (N:1)**: The current entity belongs to a parent. Implicitly creates a `hasMany` on the target.
- **hasMany (1:N)**: Explicitly define a collection of children.
- **belongsToMany (M:N)**: Bi-directional many-to-many relationship.
- **oneToOne (1:1)**: Strict unique mapping.

### Entity Definition (The Self-Sovereign Unit)

An entity in this manifest is "self-sovereign"—it encapsulates its data, its access laws (Policies), its internal consistency (Invariants), and its external interface (API).

```yaml
entities:
  <EntityName>:
    kind: aggregate-root | entity
    type: collection | single
    authenticable: boolean

    # 1. Data Schema
    properties:
      <PropertyName>:
        type: string | number | ...
        validation: { required: true, ... }

    # 2. Relationships
    relations:
      <RelationName>: { type: belongsTo, target: <Target> }

    # 3. The Constitution (Invariants)
    # Rules that the entity must uphold to remain in a valid state.
    invariants:
      - name: <InvariantName>
        expression: 'this.amount > 0'
        message: 'Amount must be positive'

    # 4. The Laws (Policies)
    # Authorization rules defining who can interact with this sovereign unit.
    policies:
      create | read | update | delete:
        - access: public | restricted | admin
          condition: self | "user.role == 'editor'"

    # 5. The Lifecycle (Hooks)
    # Logic injected into state transitions.
    hooks:
      beforeCreate | afterUpdate:
        - type: inline | script | webhook
          handler: '...'

    # 6. The Interface (API)
    # How the entity projects itself to the outside world.
    api:
      path: /custom-slug
      exclude: [DELETE]
      rateLimits: # Entity-specific protection
        - limit: 10
          ttl: 1000 # 10 req/sec for this entity
      endpoints:
        - method: POST
          path: /action
          action: customLogic
```

## 2. Domain Concepts & Principles

### The Self-Sovereign Entity

In Domain-Driven Design, an **Aggregate Root** is the "sovereign" of its domain. It is responsible for ensuring that no matter what external request comes in, the internal state remains consistent according to its **Constitution** (Invariants).

### Invariants vs. Validation

- **Validation**: Checks the _input_ (e.g., "Is this email formatted correctly?").
- **Invariants**: Checks the _state_ (e.g., "Does the sum of items equal the order total?"). Invariants are the "Constitution" that the entity enforces upon itself.

### Policies as Domain Laws

Policies are not just "API security"; they are domain-level rules about who is allowed to trigger state changes in the sovereign entity. By placing them here, we ensure that even if the entity is accessed via a different protocol (CLI, Cron, etc.), the laws are still respected.

### Value Objects (The `group` type)

In DDD, a **Value Object** is a type that is defined by its attributes rather than a unique identity (ID). Treating the `group` type as a Value Object provides several benefits:

1. **Immutability & Replacement**: You don't "update" a street name in an address; you replace the entire `Address` value object. This prevents partial, invalid states.
2. **Cohesion**: It groups related properties (e.g., `lat`, `lng`, `alt`) into a single semantic unit (`Location`), making the domain model easier to reason about.
3. **Zero Identity Overhead**: Value Objects do not have their own IDs in the database. They are stored as part of the parent entity (e.g., as a JSON column or flattened fields), which simplifies queries and reduces join complexity.
4. **Logic Encapsulation**: A Value Object can have its own internal validation logic that is independent of the parent entity.

**AIGC Guidance**: When generating code for a `group` type, the AI should treat it as a single unit. Validation should fail if _any_ part of the group is invalid, and the entire group should be overwritten during updates.

## 3. Global API & Endpoints

While most interfaces are defined within the entity scope, global endpoints handle cross-cutting concerns or complex domain services that involve multiple aggregates.

```yaml
api:
  endpoints:
    - path: /system/health
      method: GET
      handler: checkHealth # Points to a global script
    - path: /reports/summary
      method: GET
      handler: generateSummary
```

## 4. Global Settings & Security

Global settings provide defaults for the entire system. Entity-specific settings (like `api.rateLimits`) override these defaults.

```yaml
settings:
  rateLimits:
    - name: 'default-limit'
      limit: 100
      ttl: 60000 # 1 minute default
  storage:
    provider: local | s3
    baseUrl: '${BASE_URL}'
```

## 5. Design Principles & Architectural Rationale (AIGC Guidance)

This section provides the "spirit" of the design to guide Generative AI in creating **parser implementations** and **service designs**.

1. **The Manifest as a Compiler Target**: AI should treat this SPEC as a standard for building a "Domain Compiler." The goal is to generate a tool that parses this YAML and outputs a fully functional backend (e.g., Node.js/Go/Rust) that respects all defined constraints.
2. **Domain-First, API-Second**: The API is a projection of the Domain. Generative logic must ensure that all state changes (via REST, CLI, or Scripts) are guarded by the same `invariants`.
3. **Value Object Integrity**: Nested structures (`group` type) are treated as DDD Value Objects. They are immutable in spirit and must be validated as a whole unit within the parent Aggregate.
4. **Attribute-Based Sovereignty (ABAC)**: Authorization is dynamic. AI should prioritize evaluating `condition` expressions over static role mapping to allow for complex, context-aware security.
5. **Orchestrated Extensibility**: The YAML manifest is the orchestrator. Complex logic should be generated into external `script` files, while the manifest maintains the high-level "map" of the domain.
6. **Operational Self-Defense**: Entities are responsible for their own stability. AI should generate rate-limiting and validation logic as close to the entity boundary as possible.
