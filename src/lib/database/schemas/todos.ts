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
  version: 0,
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
      format: "date-time",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
    },
    replicationRevision: {
      type: "string",
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
