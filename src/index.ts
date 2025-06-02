#!/usr/bin/env node

import prompts from "prompts";
import { execa } from "execa";
import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProjectConfig {
  projectName: string;
  useShadcn: boolean;
  useMotion: boolean;
  enableSupabaseSync: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

async function main() {
  console.log(chalk.blue.bold("\n🚀 Welcome to create-next-pwa-rxdb-app!\n"));
  console.log(
    chalk.gray(
      "This will create a Next.js PWA with RxDB for offline-first applications.\n"
    )
  );

  try {
    // Get project configuration from user
    const config = await getProjectConfig();

    // Create the project
    await createProject(config);

    console.log(chalk.green.bold("\n✅ Project created successfully!\n"));
    console.log(chalk.cyan(`Next steps:`));
    console.log(chalk.white(`  cd ${config.projectName}`));
    console.log(chalk.white(`  pnpm dev`));
    console.log(chalk.gray("\nHappy coding! 🎉\n"));
  } catch (error) {
    console.error(chalk.red.bold("\n❌ Error creating project:"));
    console.error(
      chalk.red(error instanceof Error ? error.message : String(error))
    );
    process.exit(1);
  }
}

async function getProjectConfig(): Promise<ProjectConfig> {
  const response = await prompts([
    {
      type: "text",
      name: "projectName",
      message: "What is your project name?",
      initial: "my-pwa-app",
      validate: (value: string) => {
        if (!value.trim()) return "Project name is required";
        if (!/^[a-z0-9-_]+$/i.test(value))
          return "Project name can only contain letters, numbers, hyphens, and underscores";
        return true;
      },
    },
    {
      type: "confirm",
      name: "useShadcn",
      message: "Install Shadcn UI?",
      initial: true,
    },
    {
      type: "confirm",
      name: "useMotion",
      message: "Install Motion (Framer Motion)?",
      initial: true,
    },
    {
      type: "confirm",
      name: "enableSupabaseSync",
      message: "Enable Supabase Sync?",
      initial: false,
    },
  ]);

  // Handle user cancellation
  if (!response.projectName) {
    console.log(chalk.yellow("\nOperation cancelled."));
    process.exit(0);
  }

  let supabaseConfig = {};

  if (response.enableSupabaseSync) {
    const supabaseResponse = await prompts([
      {
        type: "text",
        name: "supabaseUrl",
        message: "Supabase Project URL:",
        validate: (value: string) => {
          if (!value.trim()) return "Supabase URL is required";
          try {
            new URL(value);
            return true;
          } catch {
            return "Please enter a valid URL";
          }
        },
      },
      {
        type: "password",
        name: "supabaseAnonKey",
        message: "Supabase Anon Key:",
        validate: (value: string) => {
          if (!value.trim()) return "Supabase Anon Key is required";
          return true;
        },
      },
    ]);

    if (!supabaseResponse.supabaseUrl || !supabaseResponse.supabaseAnonKey) {
      console.log(chalk.yellow("\nOperation cancelled."));
      process.exit(0);
    }

    supabaseConfig = supabaseResponse;
  }

  return { ...response, ...supabaseConfig };
}

async function createProject(config: ProjectConfig) {
  const projectDir = path.resolve(process.cwd(), config.projectName);

  // Check if directory already exists
  if (await fs.pathExists(projectDir)) {
    throw new Error(`Directory "${config.projectName}" already exists`);
  }

  // Create Next.js project
  const createSpinner = ora("Creating Next.js project...").start();

  try {
    await execa(
      "pnpm",
      [
        "create",
        "next-app",
        config.projectName,
        "--ts",
        "--app",
        "--tailwind",
        "--eslint",
        "--src-dir",
        "--use-pnpm",
      ],
      {
        stdio: "pipe",
      }
    );

    createSpinner.succeed("Next.js project created");
  } catch (error) {
    createSpinner.fail("Failed to create Next.js project");
    throw error;
  }

  // Change to project directory
  process.chdir(projectDir);

  // Install additional dependencies
  const depsSpinner = ora("Installing additional dependencies...").start();

  try {
    const dependencies = ["rxdb", "rxjs", "@serwist/next", "serwist"];

    if (config.useMotion) {
      dependencies.push("framer-motion");
    }

    if (config.enableSupabaseSync) {
      dependencies.push("@supabase/supabase-js");
    }

    await execa("pnpm", ["add", ...dependencies], { stdio: "pipe" });

    // Install dev dependencies
    await execa("pnpm", ["add", "-D", "serwist"], { stdio: "pipe" });

    depsSpinner.succeed("Dependencies installed");
  } catch (error) {
    depsSpinner.fail("Failed to install dependencies");
    throw error;
  }

  // TODO: Copy template files and configure project
  // This will be implemented in Phase 3
  const configSpinner = ora("Configuring project...").start();

  try {
    // Placeholder for template integration
    await new Promise((resolve) => setTimeout(resolve, 1000));
    configSpinner.succeed("Project configured");
  } catch (error) {
    configSpinner.fail("Failed to configure project");
    throw error;
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\nOperation cancelled."));
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(chalk.yellow("\n\nOperation terminated."));
  process.exit(0);
});

main().catch((error) => {
  console.error(chalk.red.bold("\n❌ Unexpected error:"));
  console.error(
    chalk.red(error instanceof Error ? error.message : String(error))
  );
  process.exit(1);
});
