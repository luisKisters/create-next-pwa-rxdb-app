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
import { todoSchema, TodoDocumentType } from "./schemas/todos";
import { AppCollections } from "./types";

// Add plugins
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBLeaderElectionPlugin);

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
    };
  }

  await database.addCollections(collections);

  // Setup replication revision hooks for all collections
  if (CONFIG.includeTodoExample && database.todos) {
    setupReplicationRevisionHooks(database.todos, database);
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
    docData.replicationRevision = createRevision(database.token, docData);
    return docData;
  }, false);

  // Pre-save hook to increment replicationRevision on updates
  collection.preSave((docData: any) => {
    const oldRevHeight = parseRevision(docData.replicationRevision).height;
    docData.replicationRevision =
      oldRevHeight + 1 + "-" + database.hashFunction(JSON.stringify(docData));
    return docData;
  }, false);

  // Pre-remove hook to increment replicationRevision on deletes
  collection.preRemove((docData: any) => {
    const oldRevHeight = parseRevision(docData.replicationRevision).height;
    docData.replicationRevision =
      oldRevHeight + 1 + "-" + database.hashFunction(JSON.stringify(docData));
    return docData;
  }, false);
}
