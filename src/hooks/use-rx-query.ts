"use client";

import { useEffect, useState } from "react";
import { RxQuery, RxDocument } from "rxdb";
import { useRxCollection } from "./use-rx-collection";
import { AppCollections } from "../lib/database/types";

export type QueryOptions = {
  selector?: any;
  sort?: Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[]; // RxDB sort format
  limit?: number;
  skip?: number;
};

/**
 * Hook for reactive RxDB queries
 * Based on the pattern from RxDB Supabase example: database.heroes.find({ sort: [{ name: 'asc' }] }).$.subscribe()
 *
 * Usage:
 * const todos = useRxQuery('todos', {
 *   selector: { completed: false },
 *   sort: [{ createdAt: 'desc' }]
 * });
 */
export function useRxQuery<K extends keyof AppCollections>(
  collectionName: K,
  options: QueryOptions = {}
): RxDocument<any>[] | null {
  const [documents, setDocuments] = useState<RxDocument<any>[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const collection = useRxCollection(collectionName);

  useEffect(() => {
    if (!collection) {
      setLoading(true);
      return;
    }

    let mounted = true;
    let subscription: any;

    const startQuery = async () => {
      try {
        // Build query following RxDB Supabase example pattern
        // Include sort in the find options object
        const findOptions: any = {
          selector: options.selector || {},
        };

        // Add sorting to find options
        if (options.sort) {
          if (Array.isArray(options.sort)) {
            findOptions.sort = options.sort;
          } else {
            // Convert single sort object to array format
            findOptions.sort = Object.entries(options.sort).map(
              ([field, direction]) => ({
                [field]: direction,
              })
            );
          }
        }

        // Add limit
        if (options.limit) {
          findOptions.limit = options.limit;
        }

        // Add skip
        if (options.skip) {
          findOptions.skip = options.skip;
        }

        let query = collection.find(findOptions);

        // Subscribe to reactive query (following the example pattern)
        subscription = query.$.subscribe({
          next: (docs: RxDocument<any>[]) => {
            if (mounted) {
              setDocuments(docs);
              setLoading(false);
              setError(null);
            }
          },
          error: (err: Error) => {
            if (mounted) {
              console.error("RxDB query error:", err);
              setError(err);
              setLoading(false);
            }
          },
        });
      } catch (err) {
        if (mounted) {
          console.error("Failed to start RxDB query:", err);
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    startQuery();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [collection, JSON.stringify(options)]);

  return documents;
}

/**
 * Hook for getting a single document by primary key
 * Usage: const todo = useRxDocument('todos', 'todo-id-123');
 */
export function useRxDocument<K extends keyof AppCollections>(
  collectionName: K,
  primaryKey: string
): RxDocument<any> | null {
  const [document, setDocument] = useState<RxDocument<any> | null>(null);
  const collection = useRxCollection(collectionName);

  useEffect(() => {
    if (!collection || !primaryKey) {
      setDocument(null);
      return;
    }

    let mounted = true;
    let subscription: any;

    const startQuery = async () => {
      try {
        // Find single document by primary key
        const query = collection.findOne(primaryKey);

        // Subscribe to reactive query
        subscription = query.$.subscribe({
          next: (doc: RxDocument<any> | null) => {
            if (mounted) {
              setDocument(doc);
            }
          },
          error: (err: Error) => {
            if (mounted) {
              console.error("RxDB document query error:", err);
              setDocument(null);
            }
          },
        });
      } catch (err) {
        if (mounted) {
          console.error("Failed to start RxDB document query:", err);
          setDocument(null);
        }
      }
    };

    startQuery();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [collection, primaryKey]);

  return document;
}
