# **Product Requirements Document: Next.js PWA RxDB Starter**

This document outlines the requirements for create-next-pwa-rxdb-app, a Next.js PWA starter template. It provides a pre-configured foundation for building robust, offline-first web applications.

## **1\. Key Features**

### **1.1 Core Setup**

- **Next.js:** Latest App Router.
- **TypeScript:** Full type safety.
- **Styling:** Tailwind CSS.

### **1.2 Local Data (RxDB)**

- **RxDB:** Primary local database (IndexedDB-based).
- **Functionality:** Basic data management operations.

### **1.3 Offline-First (Serwist)**

- **Serwist:** Pre-configured Service Worker.
- **Caching:** App shell and runtime caching.

### **1.4 Optional Supabase Sync**

- **Conditional:** Included if user opts-in.
- **Bi-directional:** Automatic two-way sync between RxDB and Supabase.
- **Conflict Resolution:** Basic client-side resolution.
- **Auth:** Basic Supabase Auth integration.

### **1.5 Optional Libraries**

- **Shadcn UI:** Installs and integrates if selected.
- **Motion (Framer Motion):** Installs and includes basic animation if selected.

## **2\. Technical Requirements**

- **Node.js:** Latest LTS.
- **Package Manager:** pnpm.
- **Libraries:** Next.js, RxDB, Serwist, Supabase-JS, Tailwind CSS, Motion.
- **Open Source:** All core components and sync solution must be free and open-source.
- **Stability & Docs:** Solutions must be stable and well-documented.
- **Automated Dependency Updates:** Configure for automatic package updates (e.g., Dependabot)

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

## **6\. Execution Plan: Building the create-next-pwa-rxdb-app CLI and Template**

This section outlines the high-level steps for development. **Place this entire PRD file inside the root of your create-next-pwa-rxdb-app CLI project folder.**

### **Phase 1: CLI Scaffolding Tool Setup**

1. **Initialize CLI Project:**
   - You are starting in the folder create-next-pwa-rxdb-app.
   - Initialize package.json: pnpm init \-y
   - Install necessary CLI tools: pnpm add prompts execa fs-extra chalk ora
2. **Create CLI Entry Point:**
   - Create src/index.ts (or .js).
   - Configure package.json for ES modules and bin entry.
   - Implement the CLI logic to:
     - Define prompts for user input.
     - Use ora for progress indicators and chalk for colored output.
     - Execute pnpm create next-app \[projectName\] \--ts \--app \--tailwind \--eslint \--src-dir \--use-pnpm.
     - Change directory to the new project.

### **Phase 2: Core Template Development (The "Source Template")**

1. **Create a Temporary Base Next.js Project:**
   - In a _separate_ location, create a temporary Next.js project: pnpm create next-app temp-next-pwa-template \--ts \--app \--tailwind \--eslint \--src-dir \--use-pnpm.
   - Open this temp-next-pwa-template folder in your editor. This project will contain _all_ possible features (RxDB, Serwist, Supabase Sync, Shadcn, Motion) initially.
2. **Implement Core Features in temp-next-pwa-template:**
   - **Styling Configuration:**
     - Ensure tailwind.config.ts is correctly set up.
     - Add basic placeholder configuration files for Cursor rules (e.g., .cursor/rules/ruless.mdc) and Winsurf rules (e.g., .winsurfrules).
   - **RxDB Integration:**
     - Install RxDB dependencies: pnpm add rxdb rxjs @rxdb/replication-websocket @rxdb/storage-dexie.
     - Set up RxDB database initialization (src/lib/database/index.ts), a basic collection schema (src/lib/database/collections/todos.ts including replicationRevision field and hooks), and hooks for data access (src/hooks/use-rx-collection.ts, src/hooks/use-rx-query.ts).
     - Add example code in src/app/page.tsx demonstrating basic data management operations.
   - **Serwist Implementation:**
     - Install Serwist dependencies: pnpm add @serwist/next \-D serwist.
     - Integrate Serwist by modifying next.config.mjs (wrap with withSerwist), updating tsconfig.json (add Serwist types), creating src/app/manifest.json (PWA metadata), and setting up public/sw.js (or app/sw.ts if swSrc is configured) for the Service Worker (precaching, runtime caching).
   - **Supabase Sync (Conditional Content \- _Always include in template_):**
     - Install Supabase client: pnpm add @supabase/supabase-js.
     - Create files for RxDB-Supabase replication logic (src/lib/database/sync/supabase-replication.ts based on RxDB example, including pull/push handlers, conflict resolution, replicationRevision usage).
     - Create src/lib/supabase/client.ts for Supabase client initialization.
     - Add a placeholder .env.local.example with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
     - Add a supabase/migrations folder with example SQL for the todos table schema and basic RLS policies.
   - **Shadcn UI (Conditional Content \- _Always include in template_):**
     - Run pnpm dlx shadcn-ui@latest init within temp-next-pwa-template and follow its prompts.
     - Add a few example Shadcn components (e.g., Button, Card) using pnpm dlx shadcn-ui@latest add button card.
     - Integrate these components into example UI (e.g., src/app/page.tsx).
   - **Motion (Framer Motion) (Conditional Content \- _Always include in template_):**
     - Install Motion: pnpm add framer-motion.
     - Add a simple animation example (e.g., a fading or sliding motion.div) to src/app/page.tsx.

### **Phase 3: CLI Logic for Template Integration**

1. **Copy Base Template:**
   - Switch back to your create-next-pwa-rxdb-app CLI project.
   - Modify the CLI script (src/index.ts) to:
     - Copy the _entire_ contents of temp-next-pwa-template into the new \[projectName\] directory using fs-extra.copy (excluding .git, node_modules, pnpm-lock.yaml, dist from the template).
2. **Conditional Adjustments (Post-Copy):**
   - **If enableSupabaseSync is false:**
     - Remove Supabase-related files: fs-extra.remove(path.join(projectDir, 'src/lib/database/sync/supabase-replication.ts')).
     - Remove Supabase client initialization: fs-extra.remove(path.join(projectDir, 'src/lib/supabase/client.ts')).
     - Remove supabase/migrations folder: fs-extra.remove(path.join(projectDir, 'supabase')).
     - Update src/app/page.tsx and any other relevant files to remove Supabase-specific imports and logic.
     - Remove Supabase-related environment variables from .env.local.example.
     - Adjust package.json to remove @supabase/supabase-js from dependencies.
   - **If useShadcn is false:**
     - Remove Shadcn UI components folder: fs-extra.remove(path.join(projectDir, 'src/components/ui')).
     - Remove Shadcn configuration file: fs-extra.remove(path.join(projectDir, 'components.json')).
     - Update tailwind.config.ts, globals.css to remove Shadcn-related configurations.
     - Update src/app/page.tsx and any other relevant files to remove Shadcn component imports and usage.
     - Adjust package.json to remove Shadcn-related dependencies (e.g., class-variance-authority, @radix-ui/react-\*).
   - **If useMotion is false:**
     - Update src/app/page.tsx and any other relevant files to remove framer-motion imports and usage.
     - Adjust package.json to remove framer-motion from dependencies.
3. **Final Project Setup:**
   - Modify the new project's package.json to ensure all _remaining_ necessary dependencies are correctly listed.
   - Add .env.local (with provided Supabase keys or empty if not enabled) and a README.md to the generated project.

### **Phase 4: CI/CD and Final Documentation**

1. **CI/CD Pipeline Setup:**
   - Create a .github/workflows/ci.yml file in your CLI project.
   - Configure a GitHub Actions workflow to:
     - Install Node.js and pnpm.
     - Build the CLI.
     - Run CLI tests.
     - Run end-to-end tests (scaffold a project with various configurations, install dependencies, build, and run basic checks within the scaffolded project).
2. **Final Documentation:**
   - Ensure the README.md in the generated template is clear and concise, including Supabase setup SQL.
   - Add a CONTRIBUTING.md to your CLI project.
