# create-next-pwa-rxdb-app

A Next.js PWA starter template with RxDB for offline-first applications.

## Development

This is the CLI tool that scaffolds new projects.

### Setup

```bash
pnpm install
pnpm build
```

### Testing

```bash
pnpm test
```

### Development

```bash
pnpm dev  # Watch mode for TypeScript compilation
```

## Usage

Once published, users can create new projects with:

```bash
pnpm dlx create-next-pwa-rxdb-app
```

## Implementation Status

- ✅ **Phase 1**: CLI Scaffolding Tool Setup

  - ✅ CLI entry point with prompts
  - ✅ Interactive configuration
  - ✅ Basic Next.js project creation
  - ✅ Dependency installation
  - ✅ Playwright tests

- 🚧 **Phase 2**: Core Template Development (Next)
- 🚧 **Phase 3**: CLI Logic for Template Integration
- 🚧 **Phase 4**: CI/CD and Final Documentation

## Features

The CLI prompts for:

- Project name
- Shadcn UI installation (optional)
- Motion (Framer Motion) installation (optional)
- Supabase sync enablement (optional)
  - If enabled: Supabase URL and Anon Key

## Architecture

- **TypeScript**: Full type safety
- **ES Modules**: Modern module system
- **Playwright**: End-to-end testing
- **Chalk**: Colored terminal output
- **Ora**: Loading spinners
- **Prompts**: Interactive CLI prompts
- **Execa**: Process execution
- **fs-extra**: Enhanced file system operations
