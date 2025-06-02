import { RxCollection, RxDocument } from "rxdb";
import { TodoDocumentType } from "./schemas/todos";

// Todo document and collection types
export type TodoDocument = RxDocument<TodoDocumentType, {}>;
export type TodoCollection = RxCollection<TodoDocumentType, {}, {}>;

// Database collections interface - will be conditionally populated
export type AppCollections = {
  todos?: TodoCollection;
};

// Checkpoint type for replication (following Supabase example pattern)
export type CheckpointType = {
  id: string;
  updatedAt: number;
};
