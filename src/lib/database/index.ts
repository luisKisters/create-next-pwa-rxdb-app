"use client";

import {
  addRxPlugin,
  createRxDatabase,
  createRevision,
  parseRevision,
  RxDatabase,
} from "rxdb/plugins/core";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { todoSchema, TodoDocumentType } from "./schemas/todos";
import { AppCollections } from "./types";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";

// Add plugins
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);
addRxPlugin(RxDBUpdatePlugin);

let dbPromise: Promise<RxDatabase<AppCollections>> | null = null;

// Configuration flags - will be set by CLI based on user choices
export const CONFIG = {
  includeTodoExample: true, // Will be replaced by CLI
  enableSupabaseSync: false, // Will be replaced by CLI
};

export async function getDatabase(): Promise<RxDatabase<AppCollections>> {
  if (!dbPromise) {
    dbPromise = createDatabase();
  }
  return dbPromise;
}

async function createDatabase(): Promise<RxDatabase<AppCollections>> {
  console.log("Creating RxDB database...");

  const database = await createRxDatabase<AppCollections>({
    name: "my-pwa-app",
    storage: wrappedValidateAjvStorage({
      storage: getRxStorageDexie(),
    }),
    multiInstance: true,
  });

  // Add collections based on configuration
  const collections: any = {};

  if (CONFIG.includeTodoExample) {
    collections.todos = {
      schema: todoSchema,
      methods: {},
      statics: {},
      migrationStrategies: {
        // Migration from version 0 to 1 (removed date-time format)
        // No data transformation needed since we only removed format validation
        1: function (oldDoc: any) {
          return oldDoc;
        },
      },
    };
  }

  await database.addCollections(collections);

  // Setup replication revision hooks for all collections
  if (CONFIG.includeTodoExample && database.todos) {
    setupReplicationRevisionHooks(database.todos, database);
  }

  // Start Supabase replication if enabled
  if (
    CONFIG.enableSupabaseSync &&
    CONFIG.includeTodoExample &&
    database.todos
  ) {
    try {
      const { startTodoReplication } = await import(
        "./sync/supabase-replication"
      );
      await startTodoReplication(database);
      console.log("Supabase replication started");
    } catch (error) {
      console.warn("Failed to start Supabase replication:", error);
    }
  }

  console.log("RxDB database created successfully");
  return database;
}

/**
 * Helper function to setup replicationRevision pre-hooks
 * Based on RxDB Supabase example pattern
 */
export function setupReplicationRevisionHooks(
  collection: any,
  database: RxDatabase<any>
) {
  // Pre-insert hook to set initial replicationRevision
  collection.preInsert((docData: any) => {
    // Only set replicationRevision if it's not already properly formatted
    if (!docData.replicationRevision || docData.replicationRevision === "") {
      // Create initial revision with height 1
      docData.replicationRevision =
        "1-" + database.hashFunction(JSON.stringify(docData));
    }
    return docData;
  }, false);

  // Pre-save hook to increment replicationRevision on updates
  collection.preSave((docData: any) => {
    try {
      const oldRevHeight = parseRevision(docData.replicationRevision).height;
      docData.replicationRevision =
        oldRevHeight + 1 + "-" + database.hashFunction(JSON.stringify(docData));
    } catch (error) {
      // If parsing fails, start with height 1
      console.warn("Failed to parse revision, starting fresh:", error);
      docData.replicationRevision =
        "1-" + database.hashFunction(JSON.stringify(docData));
    }
    return docData;
  }, false);

  // Pre-remove hook to increment replicationRevision on deletes
  collection.preRemove((docData: any) => {
    try {
      const oldRevHeight = parseRevision(docData.replicationRevision).height;
      docData.replicationRevision =
        oldRevHeight + 1 + "-" + database.hashFunction(JSON.stringify(docData));
    } catch (error) {
      // If parsing fails, start with height 1
      console.warn(
        "Failed to parse revision on remove, starting fresh:",
        error
      );
      docData.replicationRevision =
        "1-" + database.hashFunction(JSON.stringify(docData));
    }
    return docData;
  }, false);
}
