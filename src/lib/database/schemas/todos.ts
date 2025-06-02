import { RxJsonSchema } from "rxdb";

export type TodoDocumentType = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  replicationRevision: string; // Required for Supabase sync
};

export const todoSchema: RxJsonSchema<TodoDocumentType> = {
  title: "todo schema",
  version: 1,
  description: "describes a todo item",
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    title: {
      type: "string",
      maxLength: 200,
    },
    completed: {
      type: "boolean",
      default: false,
    },
    createdAt: {
      type: "string",
      maxLength: 30, // ISO date string length
    },
    updatedAt: {
      type: "string",
      maxLength: 30, // ISO date string length
    },
    replicationRevision: {
      type: "string",
      maxLength: 200, // RxDB revision string
    },
  },
  required: [
    "id",
    "title",
    "completed",
    "createdAt",
    "updatedAt",
    "replicationRevision",
  ],
  indexes: ["createdAt", "completed"],
};

// Schema and types are exported above
