import { RxJsonSchema, RxDocument, RxCollection } from "rxdb";
import { v4 as uuidv4 } from "uuid"; // For generating IDs

// Interface for the Todo document
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number; // milliseconds
  updatedAt: number; // milliseconds
  replicationRevision?: string; // For Supabase sync
}

// Define a type for the document methods (if any)
export interface TodosDocMethods {
  [key: string]: (...args: any[]) => any;
}

// Define a type for the collection methods (if any)
export interface TodosCollectionMethods {
  [key: string]: (...args: any[]) => any;
}

// Define the schema for the todos collection
export const todosSchema: RxJsonSchema<Todo> = {
  title: "todo schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 36, // UUID length
    },
    title: {
      type: "string",
    },
    completed: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "number",
      final: true, // Cannot be changed after creation
    },
    updatedAt: {
      type: "number",
    },
    replicationRevision: {
      type: ["string", "null"], // Can be string or null
      default: null,
    },
  },
  required: ["id", "title", "completed", "createdAt", "updatedAt"],
  indexes: ["createdAt", "updatedAt", "completed"], // Add indexes for common queries
};

// Type for the Todo document with methods
export type TodosDocument = RxDocument<Todo, TodosDocMethods>;

// Type for the Todo collection with methods
export type TodosCollection = RxCollection<
  Todo,
  TodosDocMethods,
  TodosCollectionMethods
>;

// Hooks for managing replicationRevision (as per RxDB Supabase example)
export const todosHooks = {
  preInsert: (data: Todo): void => {
    data.id = data.id || uuidv4();
    data.createdAt = data.createdAt || Date.now();
    data.updatedAt = Date.now();
    data.replicationRevision =
      data.replicationRevision || data.id + "-" + Date.now();
  },
  preSave: (data: Todo, doc: TodosDocument): void => {
    data.updatedAt = Date.now();
    data.replicationRevision = doc.id + "-" + Date.now();
  },
  preRemove: async (data: Todo, _doc: TodosDocument): Promise<void> => {
    // For logical deletion, you might mark the document as deleted
    // and update replicationRevision.
    // data.replicationRevision = data.id + '-' + Date.now();
    // For hard deletion, no specific action needed here regarding replicationRevision
    // unless your backend requires it.
    Promise.resolve();
  },
};

export const todosDocMethods: TodosDocMethods = {}; // Define if you have document-specific methods
export const todosCollectionMethods: TodosCollectionMethods = {}; // Define if you have collection-specific methods
