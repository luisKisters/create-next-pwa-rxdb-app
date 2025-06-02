#!/usr/bin/env node

import prompts from "prompts";
import { execa } from "execa";
import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";

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
      ],
      {
        stdio: "inherit",
      }
    );

    spinner.succeed("Next.js project created successfully!");

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
