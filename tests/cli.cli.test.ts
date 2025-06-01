import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import os from "os";

test.describe("CLI Tests", () => {
  let tempDir: string;

  test.beforeEach(async () => {
    // Create a temporary directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-test-"));
  });

  test.afterEach(async () => {
    // Clean up temporary directory
    if (tempDir && (await fs.pathExists(tempDir))) {
      await fs.remove(tempDir);
    }
  });

  test("CLI builds successfully", async () => {
    // Test that the CLI compiles without errors
    expect(() => {
      execSync("pnpm build", {
        cwd: process.cwd(),
        stdio: "pipe",
      });
    }).not.toThrow();

    // Check that dist directory exists
    const distPath = path.join(process.cwd(), "dist");
    expect(await fs.pathExists(distPath)).toBe(true);

    // Check that main entry file exists
    const entryPath = path.join(distPath, "index.js");
    expect(await fs.pathExists(entryPath)).toBe(true);
  });

  test("CLI entry point has correct shebang", async () => {
    // Build first
    execSync("pnpm build", {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    const entryPath = path.join(process.cwd(), "dist", "index.js");
    const content = await fs.readFile(entryPath, "utf-8");

    // Check for Node.js shebang
    expect(content.startsWith("#!/usr/bin/env node")).toBe(true);
  });

  test("package.json has correct configuration", async () => {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = await fs.readJson(packageJsonPath);

    // Check essential fields
    expect(packageJson.name).toBe("create-next-pwa-rxdb-app");
    expect(packageJson.type).toBe("module");
    expect(packageJson.bin).toEqual({
      "create-next-pwa-rxdb-app": "./dist/index.js",
    });

    // Check required dependencies
    const requiredDeps = ["prompts", "execa", "fs-extra", "chalk", "ora"];
    for (const dep of requiredDeps) {
      expect(packageJson.dependencies).toHaveProperty(dep);
    }
  });

  // TODO: Add end-to-end test that actually runs the CLI
  // This will be implemented after Phase 2 when we have the template
  test.skip("CLI creates project successfully", async () => {
    // This test will be implemented in Phase 3
    // when we have the complete template integration
  });
});
