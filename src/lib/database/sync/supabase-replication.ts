"use client";

import {
  lastOfArray,
  RxDatabase,
  RxReplicationPullStreamItem,
  RxReplicationWriteToMasterRow,
} from "rxdb";
import { Subject } from "rxjs";
import { replicateRxCollection } from "rxdb/plugins/replication";
import { supabase } from "../../supabase/client";
import { AppCollections, CheckpointType } from "../types";
import { TodoDocumentType } from "../schemas/todos";

/**
 * Start replication between RxDB todos collection and Supabase
 * Based on the official RxDB Supabase example
 * https://github.com/pubkey/rxdb/tree/master/examples/supabase
 */
export async function startTodoReplication(
  database: RxDatabase<AppCollections>
) {
  if (!database.todos) {
    console.warn("Todos collection not available - skipping replication");
    return null;
  }

  console.log("Starting RxDB-Supabase replication...");

  // Create pull stream for real-time updates
  const pullStream$ = new Subject<
    RxReplicationPullStreamItem<TodoDocumentType, CheckpointType>
  >();

  // Subscribe to Supabase real-time changes
  const channel = supabase
    .channel("realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "todos",
      },
      (payload: any) => {
        console.log("Supabase change received:", payload);
        const doc = payload.new as any;

        if (doc) {
          pullStream$.next({
            checkpoint: {
              id: doc.id,
              updatedAt: new Date(doc.updatedAt).getTime(),
            },
            documents: [doc],
          });
        }
      }
    )
    .subscribe((status: string) => {
      console.log("Supabase subscription status:", status);
      if (status === "SUBSCRIBED") {
        // Trigger initial sync
        pullStream$.next("RESYNC");
      }
    });

  // Setup replication state
  const replicationState = await replicateRxCollection<
    TodoDocumentType,
    CheckpointType
  >({
    collection: database.todos,
    replicationIdentifier: "supabase-todos-replication",
    deletedField: "deleted",
    pull: {
      async handler(lastCheckpoint, batchSize) {
        const minTimestamp = lastCheckpoint ? lastCheckpoint.updatedAt : 0;
        console.log("Pull handler - minTimestamp:", minTimestamp);

        try {
          const { data, error } = await supabase
            .from("todos")
            .select("*")
            .gt("updated_at", new Date(minTimestamp).toISOString())
            .order("updated_at", { ascending: true })
            .limit(batchSize);

          if (error) {
            console.error("Supabase pull error:", error);
            throw error;
          }

          const docs = data || [];
          console.log("Pulled documents:", docs.length);

          // Convert Supabase data to RxDB format
          const rxdbDocs = docs.map((doc) => ({
            id: doc.id,
            title: doc.title,
            completed: doc.completed,
            createdAt: doc.created_at,
            updatedAt: doc.updated_at,
            replicationRevision: doc.replication_revision,
            _deleted: doc.deleted || false,
          }));

          return {
            documents: rxdbDocs,
            checkpoint:
              rxdbDocs.length === 0
                ? lastCheckpoint || null
                : {
                    id: lastOfArray(rxdbDocs)!.id,
                    updatedAt: new Date(
                      lastOfArray(rxdbDocs)!.updatedAt
                    ).getTime(),
                  },
          };
        } catch (error) {
          console.error("Pull handler error:", error);
          throw error;
        }
      },
      batchSize: 10,
      stream$: pullStream$.asObservable(),
    },
    push: {
      batchSize: 1,
      async handler(rows: RxReplicationWriteToMasterRow<TodoDocumentType>[]) {
        console.log("Push handler called with:", rows.length, "documents");

        if (rows.length !== 1) {
          throw new Error("Push handler: expected exactly 1 document");
        }

        const row = rows[0];
        const oldDoc = row.assumedMasterState;
        const doc = row.newDocumentState;

        // Convert RxDB format to Supabase format
        const supabaseDoc = {
          id: doc.id,
          title: doc.title,
          completed: doc.completed,
          created_at: doc.createdAt,
          updated_at: doc.updatedAt,
          replication_revision: doc.replicationRevision,
        };

        try {
          // INSERT case
          if (!row.assumedMasterState) {
            console.log("Inserting new document:", doc.id);

            const { error } = await supabase
              .from("todos")
              .insert([supabaseDoc]);

            if (error) {
              console.log("Insert conflict, fetching existing document");

              // Handle insert conflict
              const { data: conflictData } = await supabase
                .from("todos")
                .select("*")
                .eq("id", doc.id)
                .limit(1);

              return conflictData ? [conflictData[0]] : [];
            }

            return [];
          }

          // UPDATE case
          console.log("Updating document:", doc.id);

          if (!oldDoc) {
            throw new Error("Missing assumedMasterState for update operation");
          }

          const { data, error } = await supabase
            .from("todos")
            .update(supabaseDoc)
            .match({
              id: doc.id,
              replication_revision: oldDoc.replicationRevision,
            })
            .select();

          if (error) {
            console.error("Update error:", error);
            throw error;
          }

          console.log("Update response:", data?.length);

          if (!data || data.length === 0) {
            // Update conflict - fetch current version
            console.log("Update conflict, fetching current document");

            const { data: conflictData } = await supabase
              .from("todos")
              .select("*")
              .eq("id", doc.id)
              .limit(1);

            return conflictData ? [conflictData[0]] : [];
          }

          return [];
        } catch (error) {
          console.error("Push handler error:", error);
          throw error;
        }
      },
    },
  });

  // Subscribe to replication errors
  replicationState.error$.subscribe((err) => {
    console.error("Replication error:", err);
  });

  // Subscribe to replication state
  replicationState.active$.subscribe((active) => {
    console.log("Replication active:", active);
  });

  console.log("RxDB-Supabase replication started successfully");

  return {
    replicationState,
    channel,
    stop: () => {
      console.log("Stopping replication...");
      replicationState.cancel();
      supabase.removeChannel(channel);
    },
  };
}
