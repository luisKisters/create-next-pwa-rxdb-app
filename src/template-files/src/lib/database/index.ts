import { createRxDatabase, RxDatabase, addRxPlugin, RxCollection } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import {
  Todo,
  TodosCollection,
  TodosDocMethods,
  todosSchema,
  todosHooks,
  todosDocMethods,
  TodosCollectionMethods,
  todosCollectionMethods,
} from "./collections/todos";

// TODO: Add collections import when created
// import { todosCollectionMethods, todosDocMethods, todosSchema } from './collections/todos';

addRxPlugin(RxDBDevModePlugin);

export type MyDatabaseCollections = {
  todos: TodosCollection;
};

// Explicitly type the RxDatabase generic
export type MyDatabase = RxDatabase<MyDatabaseCollections>;

let dbPromise: Promise<MyDatabase> | null = null;

const createDatabase = async (): Promise<MyDatabase> => {
  console.log("Creating database...");
  const db = await createRxDatabase<MyDatabaseCollections>({
    name: "nextpwarxdb",
    storage: wrappedValidateAjvStorage({
      storage: getRxStorageDexie(),
    }),
    multiInstance: true, // Default is true, but explicitly stated for clarity
    eventReduce: true, // Recommended for performance
    cleanupPolicy: {},
  });
  console.log("Database created.");

  console.log("Adding collections...");
  await db.addCollections({
    todos: {
      schema: todosSchema,
      methods: todosDocMethods,
      statics: todosCollectionMethods,
      ...todosHooks,
    },
  });
  console.log("Collections added.");

  return db;
};

export const getDatabase = (): Promise<MyDatabase> => {
  if (!dbPromise) {
    dbPromise = createDatabase();
  }
  return dbPromise;
};
