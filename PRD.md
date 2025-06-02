# create-next-pwa-rxdb-app

CLI tool that scaffolds a Next.js PWA with RxDB for offline-first applications.

## CLI Prompts

1. Project Name
2. Include todo example? (Yes/No)
3. Install Shadcn UI? (Yes/No)
4. Install Framer Motion? (Yes/No)
5. Enable Supabase Sync? (Yes/No)
   - If Yes: Prompt for Supabase Project URL, Anon Key

## Core Stack

- Next.js (App Router, TypeScript, Tailwind CSS)
- RxDB (IndexedDB storage via Dexie)
- Serwist (Service Worker/PWA)

## Implementation Plan

### 1. CLI Setup

- Initialize: `pnpm init -y`
- Dependencies: `pnpm add prompts execa fs-extra chalk ora`
- Create `src/index.ts` with CLI logic

### 2. Create Base Template

Create temporary Next.js project with ALL features:

```bash
pnpm create next-app temp-template --ts --app --tailwind --eslint --src-dir --use-pnpm
```

### 3. RxDB Integration (Fixed per docs)

```bash
pnpm add rxdb rxjs
```

Required files:

- `src/lib/database/index.ts` - Database initialization with:

  ```ts
  import { addRxPlugin, createRxDatabase } from "rxdb/plugins/core";
  import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
  import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
  import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";

  addRxPlugin(RxDBDevModePlugin);

  const db = await createRxDatabase({
    name: "myapp",
    storage: wrappedValidateAjvStorage({
      storage: getRxStorageDexie(),
    }),
  });
  ```

- `src/lib/database/schemas/todos.ts` (if todo example chosen) - JSON schema with replicationRevision field
- `src/hooks/use-rx-collection.ts` and `src/hooks/use-rx-query.ts` - React hooks

### 4. Serwist PWA

```bash
pnpm add @serwist/next -D serwist
```

- Update `next.config.mjs` with withSerwist wrapper
- Create `src/app/manifest.json`
- Setup Service Worker in `public/sw.js`

### 5. Optional: Supabase Sync

```bash
pnpm add @supabase/supabase-js
```

- `src/lib/supabase/client.ts` - Supabase client
- `src/lib/database/sync/supabase-replication.ts` - RxDB replication handlers
- `supabase/migrations/` - SQL schema and RLS policies
- `.env.local.example` with Supabase variables

### 6. Optional: Shadcn UI

```bash
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button card
```

### 7. Optional: Framer Motion

```bash
pnpm add framer-motion
```

### 8. CLI Post-Processing

After copying template, remove unwanted features based on user choices:

- Remove Supabase files if not enabled
- Remove Shadcn components if not enabled
- Remove Framer Motion if not enabled
- Remove todo example if not wanted (keep empty database setup)
- Update package.json dependencies accordingly

### 9. File Structure (Full Template)

```
src/
├── app/
│   ├── page.tsx              # Example UI (todo or empty)
│   └── manifest.json         # PWA manifest
├── lib/
│   ├── database/
│   │   ├── index.ts          # RxDB setup
│   │   ├── schemas/
│   │   │   └── todos.ts      # Collection schema (conditional)
│   │   └── sync/
│   │       └── supabase-replication.ts (conditional)
│   └── supabase/
│       └── client.ts         # Supabase client (conditional)
├── hooks/
│   ├── use-rx-collection.ts  # RxDB React hooks
│   └── use-rx-query.ts
└── components/
    └── ui/                   # Shadcn components (conditional)
```
