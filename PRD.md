# **Product Requirements Document: Next.js PWA RxDB Starter**

This document outlines the requirements for create-next-pwa-rxdb-app, a Next.js PWA starter template. The primary objective is to accelerate the development of robust, offline-first web applications by providing a pre-configured foundation. This foundation will integrate modern web best practices, including Next.js App Router, RxDB for local-first data management, Serwist for PWA capabilities, and offer configurable UI (Shadcn) and animation (Motion) libraries, alongside a seamless, optional synchronization solution with Supabase. The overall aim is to ensure a smooth and intuitive developer experience via a dlx command.

## **1\. Key Features**

### **1.1 Core Setup**

- **Next.js:** Latest App Router.
- **TypeScript:** Full type safety.
- **Styling:** Tailwind CSS.

### **1.2 Local Data (RxDB)**

- **RxDB:** Primary local database, built on IndexedDB.
- **API:** ORM-like interface for data interaction.
- **Examples:** Basic CRUD operations.

### **1.3 Offline-First (Serwist)**

- **Serwist:** Pre-configured Service Worker for PWA capabilities.
- **Caching:** App shell and runtime caching strategies.

### **1.4 Optional Supabase Sync**

- **Conditional:** Included only if user opts-in.
- **Bi-directional:** Automatic two-way sync between RxDB and Supabase.
- **Conflict Resolution:** Basic strategy implemented (client-side, current conflict handler drops local state and uses master/server state, as per RxDB example).
- **Auth:** Basic Supabase Auth integration.

### **1.5 Optional Libraries**

- **Shadcn UI:** Installs and integrates components if selected.
- **Motion (Framer Motion):** Installs and includes a basic animation example if selected.

## **2\. Technical Requirements**

- **Node.js:** Latest LTS.
- **Package Manager:** pnpm.
- **Libraries:** Next.js, RxDB, Serwist, Supabase-JS, Tailwind CSS, Motion.
- **Open Source:** All core components and sync solution must be free and open-source.
- **Stability & Docs:** Solutions must be stable and well-documented.
- **Automated Dependency Updates:** Implement a mechanism (e.g., Dependabot, Renovatebot configuration) to automatically suggest or apply package updates to keep the starter template dependencies current.
- **CI/CD Integration:** Tests for the starter template must be integrated into a GitHub Actions CI/CD pipeline to ensure continuous validation.

## **3\. Installation (pnpm dlx create-next-pwa-rxdb-app)**

The CLI will prompt for:

1. Project Name
2. Install Shadcn UI? (Yes/No)
3. Install Motion (Framer Motion)? (Yes/No)
4. Enable Supabase Sync? (Yes/No)
   - If Yes: Prompt for Supabase Project URL, Anon Key.
   - If No: RxDB only.

## **4\. Out of Scope**

- Complex multi-user collaboration beyond basic Realtime.
- Advanced custom backend API beyond Supabase.
- Mobile-specific wrappers (Capacitor, Ionic).

## **5\. Success Metrics**

- High adoption and positive community feedback.
- Ease of use and setup.
- Codebase maintainability.

## **6\. Execution Plan: Building the create-next-pwa-rxdb-app CLI and Template (Test-Driven Development)**

This section outlines the step-by-step development process, emphasizing Test-Driven Development (TDD). **Place this entire PRD file inside the root of your create-next-pwa-rxdb-app CLI project folder.** From there, you can use Cursor to follow these instructions. Each "Implementation Phase" is considered complete only when all associated tests pass.

### **Implementation Phase 1: CLI Scaffolding Tool Setup**

1. **Initialize CLI Project:**
   - **Command:** pnpm init \-y
   - **Command:** pnpm add prompts execa fs-extra chalk ora (for core CLI functionality)
   - **Action:** Open this create-next-pwa-rxdb-app folder in Cursor.
2. **Create CLI Entry Point:**
   - **Action:** Create src/index.ts (or src/index.js if not using TypeScript for the CLI itself).
   - **Action:** Add "type": "module" to package.json for ES module support.
   - **Action:** Add "bin": { "create-next-pwa-rxdb-app": "./dist/index.js" } (adjust path if not using TypeScript build) to package.json.
   - **Prompt Cursor (in src/index.ts):** "Using prompts, execa, fs-extra, chalk, and ora, create the main CLI script. It should:
     - Define the interactive prompts for projectName, useShadcn, useMotion, enableSupabaseSync.
     - If enableSupabaseSync is true, also prompt for supabaseUrl and supabaseAnonKey.
     - Use ora spinners to indicate progress for long-running operations.
     - Use chalk for colored output (success, error messages).
     - Implement initial logic to run pnpm create next-app \[projectName\] \--ts \--app \--tailwind \--eslint \--src-dir \--use-pnpm using execa.
     - Handle changing the current directory to the new project: process.chdir(projectDir);."
   - **Test-Driven Development:** Write unit tests for the CLI's prompting logic and the execution of the base pnpm create next-app command. Ensure these tests pass before proceeding.

### **Implementation Phase 2: Core Template Development (The "Source Template")**

1. **Create a Temporary Base Next.js Project:**
   - **Action:** In a _separate_ terminal (outside your create-next-pwa-rxdb-app CLI project), create a temporary Next.js project that will serve as your template's source code.
   - **Command:** pnpm create next-app temp-next-pwa-template \--ts \--app \--tailwind \--eslint \--src-dir \--use-pnpm
   - **Action:** Open this temp-next-pwa-template folder in Cursor (you can have two Cursor windows open, one for the CLI and one for the template).
2. **Implement Core Features in temp-next-pwa-template:**
   - **Styling Configuration (Cursor & Winsurf):**
     - **Action:** Ensure tailwind.config.ts is correctly set up.
     - **Prompt Cursor (in temp-next-pwa-template):** "Generate a basic configuration file for Cursor rules (e.g., .cursorrc or similar, assuming a conceptual config for editor rules) and Winsurf rules (e.g., winsurf.config.js or similar, assuming a conceptual config for a design system tool). These should be simple placeholders indicating where user-defined rules for editor behavior and UI component generation would go."
     - **Test-Driven Development:** Write tests to confirm these configuration files exist and have the expected basic structure.
   - **RxDB Integration:**
     - **Action:** Install RxDB dependencies: pnpm add rxdb rxjs @rxdb/replication-websocket @rxdb/storage-dexie (using @rxdb/storage-dexie for IndexedDB, and @rxdb/replication-websocket as a base for custom replication if needed, though the example uses a custom one).
     - **Prompt Cursor (in temp-next-pwa-template):** "Set up RxDB. Create src/lib/database/index.ts for database initialization. Create src/lib/database/collections/todos.ts to define a basic 'todos' RxCollection schema, including id, title, completed, createdAt, updatedAt, and replicationRevision (as per RxDB Supabase example). Implement preInsert, preRemove, preSave hooks to manage replicationRevision for conflict detection. Create src/hooks/use-rx-collection.ts and src/hooks/use-rx-query.ts for convenient data access."
     - **Action:** Modify src/app/page.tsx to demonstrate basic CRUD operations (add, list, toggle complete, delete) using the RxDB hooks.
     - **Test-Driven Development:** Write integration tests for RxDB CRUD operations within the temp-next-pwa-template project. Ensure these tests pass.
   - **Serwist Implementation:**
     - **Action:** Install Serwist dependencies: pnpm add @serwist/next \-D serwist.
     - **Prompt Cursor (in temp-next-pwa-template):** "Integrate Serwist for PWA. Modify next.config.mjs to wrap with withSerwist. Update tsconfig.json with Serwist types. Create src/app/manifest.json with PWA metadata (name, short_name, icons, theme_color, background_color, display, start_url). Create public/sw.js (or app/sw.ts if using swSrc in next.config.mjs) for the Service Worker, including precaching and runtime caching strategies (e.g., defaultCache from @serwist/next/worker). Ensure app/layout.tsx links to the manifest."
     - **Test-Driven Development:** Write tests to verify Service Worker registration, caching behavior (e.g., app shell loads offline), and manifest presence. Ensure these tests pass.
   - **Supabase Sync (Conditional Content in temp-next-pwa-template):**
     - **Action:** Install Supabase client: pnpm add @supabase/supabase-js.
     - **Prompt Cursor (in temp-next-pwa-template):** "Based on the RxDB Supabase example (rxdb/examples/supabase), create src/lib/database/sync/supabase-replication.ts. This file should contain the pull and push handlers for RxDB's replication protocol. The pull handler should use Supabase Realtime subscriptions for changelog and fetch data. The push handler should use supabase-js to insert/update/delete records. Implement the conflict resolution logic from the RxDB example (server wins). Ensure replicationRevision is used for conflict detection. Also, create src/lib/supabase/client.ts to initialize the Supabase client."
     - **Action:** Add a placeholder .env.local.example file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
     - **Action:** Create a supabase/migrations folder with an example SQL file for the todos table schema and basic RLS policies. This will be part of the starter's documentation.
     - **Test-Driven Development:** Write integration tests to verify bi-directional synchronization with a mock or local Supabase instance. Test offline writes and subsequent sync. Ensure these tests pass.
   - **Shadcn UI (Conditional Content in temp-next-pwa-template):**
     - **Action:** Run pnpm dlx shadcn-ui@latest init within temp-next-pwa-template and follow its prompts (select Next.js, TypeScript, Tailwind, App Router).
     - **Action:** Add a few example Shadcn components (e.g., Button, Card) using pnpm dlx shadcn-ui@latest add button card.
     - **Action:** Integrate these components into src/app/page.tsx or a new example component.
     - **Test-Driven Development:** Write snapshot tests or basic rendering tests for the integrated Shadcn components. Ensure these tests pass.
   - **Motion (Framer Motion) (Conditional Content in temp-next-pwa-template):**
     - **Action:** Install Motion: pnpm add framer-motion.
     - **Action:** Add a simple animation example (e.g., a fading or sliding motion.div) to src/app/page.tsx.
     - **Test-Driven Development:** Write basic rendering tests to ensure Motion components are present and do not cause errors. Ensure these tests pass.

### **Implementation Phase 3: CLI Logic for Template Integration**

1. **Copy Template Logic in CLI:**
   - **Action:** Switch back to your create-next-pwa-rxdb-app CLI project in Cursor.
   - **Prompt Cursor (in src/index.ts):** "After pnpm create next-app is done, modify the CLI to:
     - Copy the contents of the temp-next-pwa-template directory (excluding .git, node_modules, pnpm-lock.yaml, dist, temp-next-pwa-template's package.json if copying the whole folder) into the newly created \[projectName\] directory using fs-extra.copy.
     - Adjust the package.json of the new project to include rxdb, rxjs, @rxdb/replication-websocket, @rxdb/storage-dexie, @serwist/next, serwist, framer-motion (if selected), and @supabase/supabase-js (if selected).
     - Conditionally remove/add files related to Supabase sync if the user opted out.
     - Conditionally remove/add example code related to Shadcn UI and Motion if the user opted out.
     - Add the .env.local file with Supabase credentials (if enabled) or just the example file (if not).
     - Add a README.md to the generated project with instructions, including Supabase setup SQL."
   - **Test-Driven Development:** Write end-to-end tests for the CLI to ensure that generated projects have the correct file structure and dependencies based on user prompts. These tests should run pnpm dlx create-next-pwa-rxdb-app with various inputs and then assert the generated project's contents. Ensure these tests pass.
2. **Clean-up and Final Touches for CLI:**
   - **Prompt Cursor:** "Add a final success message using chalk and instructions for the user to cd into the new project and run pnpm dev. Ensure robust error handling for all execa and fs-extra calls."
   - **Action:** Add a postinstall script to your CLI's package.json to build the TypeScript source (tsc).
   - **Test-Driven Development:** Add unit tests for utility functions or error handling in the CLI. Ensure these tests pass.

### **Implementation Phase 4: CI/CD and Final Documentation**

1. **CI/CD Pipeline Setup:**
   - **Action:** Create a .github/workflows/ci.yml file in your create-next-pwa-rxdb-app CLI project.
   - **Prompt Cursor:** "Create a GitHub Actions workflow that:
     - Installs Node.js and pnpm.
     - Installs CLI dependencies.
     - Builds the CLI.
     - Runs the CLI's own tests.
     - Runs the end-to-end tests that scaffold a project and then run pnpm install and pnpm build within the scaffolded project to verify its integrity.
     - (If possible, and without requiring live Supabase keys in CI directly) Add a step to run the scaffolded project's tests (e.g., RxDB CRUD, PWA tests) in a headless browser environment."
   - **Test-Driven Development:** Ensure the CI workflow runs successfully on every push to the repository.
2. **Final Documentation:**
   - **Action:** Ensure the README.md in the generated template is clear and concise, providing all necessary setup instructions for Supabase (including SQL for table creation and RLS, as per the RxDB example).
   - **Action:** Add a CONTRIBUTING.md to your CLI project for future contributions.
   - **Test-Driven Development:** (Conceptual) Review documentation for clarity, completeness, and accuracy.
