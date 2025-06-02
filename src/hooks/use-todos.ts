"use client";

import { getDatabase } from "../lib/database";
import { TodoDocumentType } from "../lib/database/schemas/todos";

/**
 * Todo operations hook - demonstrates RxDB patterns based on Supabase example
 * Similar to handlers.ts in the RxDB Supabase example
 */
export const useTodos = () => {
  const addTodo = async (title: string): Promise<void> => {
    try {
      const db = await getDatabase();
      if (!db.todos) {
        throw new Error("Todos collection not available");
      }

      const newTodo: TodoDocumentType = {
        id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replicationRevision: "", // Will be set by pre-insert hook
      };

      await db.todos.insert(newTodo);
      console.log("Todo added:", newTodo);
    } catch (error) {
      console.error("Failed to add todo:", error);
      throw error;
    }
  };

  const toggleTodo = async (id: string): Promise<void> => {
    try {
      const db = await getDatabase();
      if (!db.todos) {
        throw new Error("Todos collection not available");
      }

      const doc = await db.todos.findOne(id).exec();
      if (doc) {
        await doc.update({
          $set: {
            completed: !doc.completed,
            updatedAt: new Date().toISOString(),
          },
        });
        console.log("Todo toggled:", doc.toJSON());
      }
    } catch (error) {
      console.error("Failed to toggle todo:", error);
      throw error;
    }
  };

  const deleteTodo = async (id: string): Promise<void> => {
    try {
      const db = await getDatabase();
      if (!db.todos) {
        throw new Error("Todos collection not available");
      }

      const doc = await db.todos.findOne(id).exec();
      if (doc) {
        await doc.remove();
        console.log("Todo deleted:", id);
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
      throw error;
    }
  };

  const getAllTodos = async () => {
    try {
      const db = await getDatabase();
      if (!db.todos) {
        throw new Error("Todos collection not available");
      }

      // Following the pattern from RxDB Supabase example
      return await db.todos
        .find({
          sort: [{ createdAt: "desc" }],
        })
        .exec();
    } catch (error) {
      console.error("Failed to get todos:", error);
      throw error;
    }
  };

  const getActiveTodos = async () => {
    try {
      const db = await getDatabase();
      if (!db.todos) {
        throw new Error("Todos collection not available");
      }

      return await db.todos
        .find({
          selector: { completed: false },
          sort: [{ createdAt: "desc" }],
        })
        .exec();
    } catch (error) {
      console.error("Failed to get active todos:", error);
      throw error;
    }
  };

  return {
    addTodo,
    toggleTodo,
    deleteTodo,
    getAllTodos,
    getActiveTodos,
  };
};
