# Untitled Solution

A monorepo project built with Bun, Qwik, and Cloudflare Workers.

## Project Structure

This repository is organized into several workspaces:

### Apps

- **[apps/admin](apps/admin)**: Admin dashboard built with Qwik.

### Packages

- **[packages/core](packages/core)**: Core domain logic, entities, and utilities.
- **[packages/design](packages/design)**: Design system and UI components built with Qwik and daisyUI.
- **[packages/flow](packages/flow)**: Flow-based UI components and logic.
- **[packages/schema](packages/schema)**: JSON schemas and validation logic.
- **[packages/plugin](packages/plugin)**: Plugin system.
- **[packages/example](packages/example)**: Example package.

### Services

- **[services/admin](services/admin)**: Backend service for the admin application, deployed via Wrangler.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.

### Installation

```bash
bun install
```

### Development

To run the development servers, navigate to the respective app or service directory and run:

```bash
bun run dev
```

## Scripts

- `bun run lint`: Run ESLint across the project.
- `bun run format`: Format code with Prettier.
- `bun run typecheck`: Run TypeScript type checking.
- `bun run select-model`: Select AI model for development (internal script).

## License

BSD-3-Clause
