#!/usr/bin/env node

import prompts from "prompts";
import { execa } from "execa";
import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupProject(
  projectName: string,
  config: any,
  supabaseConfig: any
) {
  const projectPath = path.resolve(process.cwd(), projectName);
  const cliRootPath = path.resolve(__dirname, "..");

  console.log(chalk.blue("\n🔧 Setting up RxDB and PWA features..."));

  // Install RxDB dependencies
  await installDependencies(projectPath, config);

  // Copy RxDB files
  await copyRxDBFiles(projectPath, cliRootPath, config);

  // Setup PWA with Serwist
  await setupPWA(projectPath);

  // Setup optional features
  if (config.useShadcn) {
    await setupShadcn(projectPath);
  }

  if (config.useMotion) {
    await setupFramerMotion(projectPath);
  }

  if (config.enableSupabaseSync && supabaseConfig) {
    await setupSupabase(projectPath, supabaseConfig);
  }

  // Update configuration files
  await updateConfigFiles(projectPath, config);

  // Create example page if todo example is included
  if (config.includeTodoExample) {
    await createTodoExamplePage(projectPath);
  }

  console.log(chalk.green("✅ RxDB and PWA setup complete!"));
}

async function installDependencies(projectPath: string, config: any) {
  const spinner = ora("Installing RxDB dependencies...").start();

  const dependencies = ["rxdb", "rxjs"];
  const devDependencies = ["@serwist/next", "serwist"];

  if (config.enableSupabaseSync) {
    dependencies.push("@supabase/supabase-js");
  }

  if (config.useMotion) {
    dependencies.push("framer-motion");
  }

  try {
    // Install production dependencies
    await execa("pnpm", ["add", ...dependencies], {
      cwd: projectPath,
      stdio: "pipe",
    });

    // Install dev dependencies
    await execa("pnpm", ["add", "-D", ...devDependencies], {
      cwd: projectPath,
      stdio: "pipe",
    });

    spinner.succeed("Dependencies installed successfully!");
  } catch (error) {
    spinner.fail("Failed to install dependencies");
    throw error;
  }
}

async function copyRxDBFiles(
  projectPath: string,
  cliRootPath: string,
  config: any
) {
  const spinner = ora("Setting up RxDB files...").start();

  try {
    // Copy database files
    await fs.copy(
      path.join(cliRootPath, "src/lib/database"),
      path.join(projectPath, "src/lib/database")
    );

    // Copy hooks
    await fs.copy(
      path.join(cliRootPath, "src/hooks"),
      path.join(projectPath, "src/hooks")
    );

    // Copy Supabase client files if sync is enabled
    if (config.enableSupabaseSync) {
      await fs.copy(
        path.join(cliRootPath, "src/lib/supabase"),
        path.join(projectPath, "src/lib/supabase")
      );
    }

    // Update database config based on user choices
    const dbConfigPath = path.join(projectPath, "src/lib/database/index.ts");
    let dbConfig = await fs.readFile(dbConfigPath, "utf-8");

    dbConfig = dbConfig.replace(
      "includeTodoExample: true, // Will be replaced by CLI",
      `includeTodoExample: ${config.includeTodoExample}, // Set by CLI`
    );

    dbConfig = dbConfig.replace(
      "enableSupabaseSync: false, // Will be replaced by CLI",
      `enableSupabaseSync: ${config.enableSupabaseSync}, // Set by CLI`
    );

    dbConfig = dbConfig.replace(
      'name: "my-pwa-app"',
      `name: "${config.projectName}"`
    );

    await fs.writeFile(dbConfigPath, dbConfig);

    // Remove todo-related files if not wanted
    if (!config.includeTodoExample) {
      await fs.remove(
        path.join(projectPath, "src/lib/database/schemas/todos.ts")
      );
      await fs.remove(path.join(projectPath, "src/hooks/use-todos.ts"));
    }

    spinner.succeed("RxDB files setup complete!");
  } catch (error) {
    spinner.fail("Failed to setup RxDB files");
    throw error;
  }
}

async function setupPWA(projectPath: string) {
  const spinner = ora("Setting up PWA with Serwist...").start();

  try {
    // Update next.config.mjs
    const nextConfigPath = path.join(projectPath, "next.config.mjs");
    const nextConfig = `import withSerwist from "@serwist/next";

const withSerwistConfig = withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSerwistConfig(nextConfig);
`;

    await fs.writeFile(nextConfigPath, nextConfig);

    // Create manifest.json
    const manifestPath = path.join(projectPath, "src/app/manifest.json");
    const manifest = {
      name: "PWA App",
      short_name: "PWA App",
      description: "A Progressive Web App built with Next.js and RxDB",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#000000",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    };

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    // Create service worker
    const swPath = path.join(projectPath, "src/app/sw.ts");
    const sw = `import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// This declares the value of \`injectionPoint\` to TypeScript.
// \`injectionPoint\` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// \`"self.__SW_MANIFEST"\`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
`;

    await fs.writeFile(swPath, sw);

    spinner.succeed("PWA setup complete!");
  } catch (error) {
    spinner.fail("Failed to setup PWA");
    throw error;
  }
}

async function setupShadcn(projectPath: string) {
  const spinner = ora("Setting up Shadcn UI...").start();

  try {
    await execa("pnpm", ["dlx", "shadcn-ui@latest", "init", "--yes"], {
      cwd: projectPath,
      stdio: "pipe",
    });

    await execa("pnpm", ["dlx", "shadcn-ui@latest", "add", "button", "card"], {
      cwd: projectPath,
      stdio: "pipe",
    });

    spinner.succeed("Shadcn UI setup complete!");
  } catch (error) {
    spinner.fail("Failed to setup Shadcn UI");
    throw error;
  }
}

async function setupFramerMotion(projectPath: string) {
  const spinner = ora("Setting up Framer Motion...").start();

  try {
    await execa("pnpm", ["add", "framer-motion"], {
      cwd: projectPath,
      stdio: "pipe",
    });

    spinner.succeed("Framer Motion setup complete!");
  } catch (error) {
    spinner.fail("Failed to setup Framer Motion");
    throw error;
  }
}

async function setupSupabase(projectPath: string, supabaseConfig: any) {
  const spinner = ora("Setting up Supabase...").start();

  try {
    // Create .env.local
    const envPath = path.join(projectPath, ".env.local");
    const envContent = `NEXT_PUBLIC_SUPABASE_URL=${supabaseConfig.supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseConfig.supabaseAnonKey}
`;

    await fs.writeFile(envPath, envContent);

    // Create .env.local.example
    const envExamplePath = path.join(projectPath, ".env.local.example");
    const envExampleContent = `NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
`;

    await fs.writeFile(envExamplePath, envExampleContent);

    spinner.succeed("Supabase setup complete!");
  } catch (error) {
    spinner.fail("Failed to setup Supabase");
    throw error;
  }
}

async function updateESLintConfig(projectPath: string) {
  const eslintConfigPath = path.join(projectPath, "eslint.config.mjs");

  try {
    let eslintConfig = await fs.readFile(eslintConfigPath, "utf-8");

    // Add relaxed rules to the ESLint config
    eslintConfig = eslintConfig.replace(
      /const eslintConfig = \[\s*\.\.\.compat\.extends\("next\/core-web-vitals", "next\/typescript"\),\s*\];/,
      `const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/exhaustive-deps": "warn",
      "prefer-const": "warn",
    },
  },
];`
    );

    await fs.writeFile(eslintConfigPath, eslintConfig);
  } catch (error: any) {
    console.warn("Could not update ESLint config:", error.message);
  }
}

async function updateConfigFiles(projectPath: string, config: any) {
  const spinner = ora("Updating configuration files...").start();

  try {
    // Update layout.tsx to include manifest and fix font issues
    const layoutPath = path.join(projectPath, "src/app/layout.tsx");
    let layout = await fs.readFile(layoutPath, "utf-8");

    // Remove Geist font imports that cause issues
    layout = layout.replace(
      /import { Geist, Geist_Mono } from "next\/font\/google";\s*/g,
      ""
    );
    layout = layout.replace(
      /import { Geist_Mono } from "next\/font\/google";\s*/g,
      ""
    );
    layout = layout.replace(
      /import { Geist } from "next\/font\/google";\s*/g,
      ""
    );

    // Remove font variable declarations
    layout = layout.replace(/const geistSans = Geist\(\{[\s\S]*?\}\);\s*/g, "");
    layout = layout.replace(
      /const geistMono = Geist_Mono\(\{[\s\S]*?\}\);\s*/g,
      ""
    );

    // Remove font variables from className
    layout = layout.replace(
      /className={\`\$\{geistSans\.variable\} \$\{geistMono\.variable\} antialiased\`}/g,
      'className="antialiased"'
    );
    layout = layout.replace(
      /className={\`\$\{geistSans\.variable\} \$\{geistMono\.variable\}\`}/g,
      'className=""'
    );

    // Add manifest link to head
    layout = layout.replace(
      "</head>",
      '  <link rel="manifest" href="/manifest.json" />\n</head>'
    );

    await fs.writeFile(layoutPath, layout);

    // Update ESLint config to disable problematic rules
    await updateESLintConfig(projectPath);

    spinner.succeed("Configuration files updated!");
  } catch (error) {
    spinner.fail("Failed to update configuration files");
    throw error;
  }
}

async function createTodoExamplePage(projectPath: string) {
  const spinner = ora("Creating todo example page...").start();

  try {
    const pagePath = path.join(projectPath, "src/app/page.tsx");
    const todoPageContent = `"use client";

import { useState } from "react";
import { useTodos } from "@/hooks/use-todos";
import { useRxQuery } from "@/hooks/use-rx-query";
import { TodoDocumentType } from "@/lib/database/schemas/todos";
import type { RxDocument } from "rxdb";

export default function TodoApp() {
  const { addTodo, toggleTodo, deleteTodo } = useTodos();
  const todos = useRxQuery("todos", {
    sort: { createdAt: "desc" },
  });
  const [newTodo, setNewTodo] = useState("");
  const loading = todos === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      await addTodo(newTodo.trim());
      setNewTodo("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading RxDB...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Offline-First Todo App
        </h1>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">
            ✨ This app works offline! Try disconnecting your internet and adding todos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
        </form>

                 <div className="space-y-2">
           {!todos || todos.length === 0 ? (
             <p className="text-gray-500 text-center py-8">
               No todos yet. Add one above!
             </p>
           ) : (
             todos.map((todo: RxDocument<TodoDocumentType>) => (
               <div
                 key={todo.id}
                 className="flex items-center gap-3 p-3 border border-gray-200 rounded-md"
               >
                 <input
                   type="checkbox"
                   checked={todo.completed}
                   onChange={() => toggleTodo(todo.id)}
                   className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                 />
                 <span
                   className={\`flex-1 \${
                     todo.completed
                       ? "line-through text-gray-500"
                       : "text-gray-800"
                   }\`}
                 >
                   {todo.title}
                 </span>
                 <button
                   onClick={() => deleteTodo(todo.id)}
                   className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                 >
                   ✕
                 </button>
               </div>
             ))
           )}
         </div>

         <div className="mt-6 text-center text-sm text-gray-500">
           Total: {todos?.length || 0} | Completed: {todos?.filter((t: RxDocument<TodoDocumentType>) => t.completed).length || 0}
         </div>
      </div>
    </div>
  );
}
`;

    await fs.writeFile(pagePath, todoPageContent);
    spinner.succeed("Todo example page created!");
  } catch (error) {
    spinner.fail("Failed to create todo example page");
    throw error;
  }
}

async function main() {
  console.log(chalk.blue("🚀 Welcome to create-next-pwa-rxdb-app"));
  console.log(chalk.gray("Let's set up your Next.js PWA with RxDB\n"));

  const response = await prompts([
    {
      type: "text",
      name: "projectName",
      message: "What is your project name?",
      initial: "my-pwa-app",
    },
    {
      type: "confirm",
      name: "includeTodoExample",
      message: "Include todo example?",
      initial: true,
    },
    {
      type: "confirm",
      name: "useShadcn",
      message: "Install Shadcn UI?",
      initial: false,
    },
    {
      type: "confirm",
      name: "useMotion",
      message: "Install Framer Motion?",
      initial: false,
    },
    {
      type: "confirm",
      name: "enableSupabaseSync",
      message: "Enable Supabase Sync?",
      initial: false,
    },
  ]);

  // If Supabase sync is enabled, prompt for credentials
  let supabaseConfig = null;
  if (response.enableSupabaseSync) {
    supabaseConfig = await prompts([
      {
        type: "text",
        name: "supabaseUrl",
        message: "Supabase Project URL:",
        validate: (value: string) =>
          value.includes("supabase.co")
            ? true
            : "Please enter a valid Supabase URL",
      },
      {
        type: "text",
        name: "supabaseAnonKey",
        message: "Supabase Anon Key:",
        validate: (value: string) =>
          value.length > 10 ? true : "Please enter a valid anon key",
      },
    ]);
  }

  console.log(chalk.green("\n✅ Configuration complete!"));
  console.log("Settings:", { ...response, supabaseConfig });

  // Create Next.js project
  const spinner = ora("Creating Next.js project...").start();

  try {
    await execa(
      "pnpm",
      [
        "create",
        "next-app",
        response.projectName,
        "--ts",
        "--app",
        "--tailwind",
        "--eslint",
        "--src-dir",
        "--use-pnpm",
        "--turbopack",
        "--import-alias",
        "@/*",
        "--yes",
      ],
      {
        stdio: "inherit",
      }
    );

    spinner.succeed("Next.js project created successfully!");

    // Setup RxDB and PWA features
    await setupProject(response.projectName, response, supabaseConfig);

    console.log(
      chalk.green(`\n🎉 Project "${response.projectName}" has been created!`)
    );
    console.log(chalk.gray(`Next steps:`));
    console.log(chalk.gray(`  cd ${response.projectName}`));
    console.log(chalk.gray(`  pnpm dev`));
  } catch (error) {
    spinner.fail("Failed to create Next.js project");
    throw error;
  }
}

main().catch((error) => {
  console.error(chalk.red("Error:"), error);
  process.exit(1);
});
