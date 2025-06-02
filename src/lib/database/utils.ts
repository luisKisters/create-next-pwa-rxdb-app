"use client";

import { getDatabase } from "./index";

/**
 * Utility to setup reactive query subscriptions
 * Based on the pattern from RxDB Supabase example: database.heroes.find().$.subscribe()
 */
export const createTodoSubscription = (
  callback: (todos: any[]) => void,
  options: { completed?: boolean } = {}
) => {
  let subscription: any = null;

  const start = async () => {
    try {
      const db = await getDatabase();
      if (!db.todos) {
        console.warn("Todos collection not available");
        return;
      }

      // Build query based on options
      let query = db.todos.find();

      if (options.completed !== undefined) {
        query = db.todos.find({
          selector: { completed: options.completed },
        });
      }

      // Add sorting (following Supabase example pattern)
      query = query.sort("createdAt");

      // Subscribe to reactive query
      subscription = query.$.subscribe({
        next: (todos) => {
          console.log("Todos updated:", todos.length);
          // Convert RxDB documents to plain objects
          const todoData = todos.map((doc) => doc.toJSON(true));
          callback(todoData);
        },
        error: (error) => {
          console.error("Todo subscription error:", error);
        },
      });
    } catch (error) {
      console.error("Failed to start todo subscription:", error);
    }
  };

  const stop = () => {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
  };

  // Start immediately
  start();

  return {
    stop,
    restart: start,
  };
};

/**
 * One-time query utility
 * Useful for server components or static data
 */
export const queryTodos = async (options: { completed?: boolean } = {}) => {
  try {
    const db = await getDatabase();
    if (!db.todos) {
      console.warn("Todos collection not available");
      return [];
    }

    let query = db.todos.find();

    if (options.completed !== undefined) {
      query = db.todos.find({
        selector: { completed: options.completed },
      });
    }

    query = query.sort("createdAt");

    const results = await query.exec();
    return results.map((doc) => doc.toJSON(true));
  } catch (error) {
    console.error("Failed to query todos:", error);
    return [];
  }
};
