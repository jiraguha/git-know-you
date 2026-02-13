# CLAUDE.md

This file provides guidance for Claude when working on this project.

## Project Overview

This is a Bun/TypeScript project.

## Commands

```bash
# Install dependencies
bun install

# Run the project
bun run src/index.ts

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Type check
bun run tsc --noEmit

# Lint (if configured)
bun run lint

# Format (if configured)
bun run format
```

## Code Style

### TypeScript

- Use strict TypeScript (`"strict": true` in tsconfig.json)
- Prefer `type` over `interface` unless declaration merging is needed
- Use explicit return types on exported functions
- Avoid `any`; use `unknown` when type is truly unknown
- Use `const` by default, `let` when reassignment is needed, never `var`
- Prefer nullish coalescing (`??`) over logical OR (`||`) for defaults
- Use optional chaining (`?.`) for nullable property access

### Imports

- Use ES modules (`import`/`export`)
- Prefer named exports over default exports
- Group imports: external deps, then internal modules, then types
- Use `import type` for type-only imports

### Naming Conventions

- `camelCase` for variables, functions, methods
- `PascalCase` for types, interfaces, classes, components
- `SCREAMING_SNAKE_CASE` for constants
- Prefix boolean variables with `is`, `has`, `should`, `can`
- Use descriptive names; avoid abbreviations

### File Structure

- Use `.ts` extension for TypeScript files
- Keep files focused and small (< 300 lines preferred)
- Co-locate tests with source files (`*.test.ts`) or in `__tests__/` directory
- Use barrel exports (`index.ts`) sparingly

### Error Handling

- Use typed errors or error classes for domain errors
- Prefer early returns to reduce nesting
- Always handle promise rejections
- Use `Result` pattern for operations that can fail predictably

### Functions

- Prefer pure functions where possible
- Keep functions small and single-purpose
- Use arrow functions for callbacks and inline functions
- Use function declarations for top-level named functions

### Async/Await

- Always use `async`/`await` over raw promises
- Handle errors with try/catch at appropriate boundaries
- Avoid mixing `.then()` chains with `async`/`await`

## Testing

- Write tests for all business logic
- Use descriptive test names: `should [expected behavior] when [condition]`
- Follow Arrange-Act-Assert pattern
- Prefer integration tests over unit tests for IO operations
- Mock external dependencies, not internal modules

## Bun-Specific

- Use `Bun.file()` for file operations
- Use `Bun.serve()` for HTTP servers
- Use `Bun.sql` or `bun:sqlite` for database operations
- Leverage Bun's built-in test runner (`bun test`)
- Use `Bun.env` for environment variables
