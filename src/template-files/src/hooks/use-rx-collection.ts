import { useState, useEffect } from "react";
import { RxCollection, RxDatabase } from "rxdb";
import { getDatabase, MyDatabaseCollections } from "../lib/database";

export function useRxCollection<
  CollectionName extends keyof MyDatabaseCollections
>(
  collectionName: CollectionName
): RxCollection<
  MyDatabaseCollections[CollectionName]["schema"]["jsonSchema"],
  MyDatabaseCollections[CollectionName]["schema"]["docMethods"],
  MyDatabaseCollections[CollectionName]["schema"]["collectionMethods"]
> | null {
  const [collection, setCollection] = useState<RxCollection<
    MyDatabaseCollections[CollectionName]["schema"]["jsonSchema"],
    MyDatabaseCollections[CollectionName]["schema"]["docMethods"],
    MyDatabaseCollections[CollectionName]["schema"]["collectionMethods"]
  > | null>(null);
  const [db, setDb] = useState<RxDatabase<MyDatabaseCollections> | null>(null);

  useEffect(() => {
    const initDB = async () => {
      const database = await getDatabase();
      setDb(database);
    };
    initDB();
  }, []);

  useEffect(() => {
    if (db && db[collectionName]) {
      setCollection(db[collectionName]);
    }
  }, [db, collectionName]);

  return collection;
}
