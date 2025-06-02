"use client";

import { useEffect, useState } from "react";
import { RxDatabase } from "rxdb";
import { getDatabase } from "../lib/database";
import { AppCollections, TodoCollection } from "../lib/database/types";

/**
 * Hook to get access to a specific RxDB collection
 * Usage: const todosCollection = useRxCollection('todos');
 */
export function useRxCollection<K extends keyof AppCollections>(
  collectionName: K
): AppCollections[K] | null {
  const [collection, setCollection] = useState<AppCollections[K] | null>(null);
  const [database, setDatabase] = useState<RxDatabase<AppCollections> | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    const initCollection = async () => {
      try {
        const db = await getDatabase();
        if (mounted) {
          setDatabase(db);
          // Access the collection dynamically
          const coll = (db as any)[collectionName];
          setCollection(coll || null);
        }
      } catch (error) {
        console.error("Failed to initialize collection:", error);
        if (mounted) {
          setCollection(null);
        }
      }
    };

    initCollection();

    return () => {
      mounted = false;
    };
  }, [collectionName]);

  return collection;
}

/**
 * Hook to get the entire RxDB database instance
 * Usage: const database = useRxDatabase();
 */
export function useRxDatabase(): RxDatabase<AppCollections> | null {
  const [database, setDatabase] = useState<RxDatabase<AppCollections> | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    const initDatabase = async () => {
      try {
        const db = await getDatabase();
        if (mounted) {
          setDatabase(db);
        }
      } catch (error) {
        console.error("Failed to initialize database:", error);
        if (mounted) {
          setDatabase(null);
        }
      }
    };

    initDatabase();

    return () => {
      mounted = false;
    };
  }, []);

  return database;
}
