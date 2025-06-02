import { useState, useEffect } from "react";
import { RxQuery, RxCollection, RxDocument } from "rxdb";
import { getDatabase, MyDatabaseCollections } from "../lib/database";

export function useRxQuery<CollectionName extends keyof MyDatabaseCollections>(
  collectionName: CollectionName,
  queryBuilder?: (
    collection: RxCollection<
      MyDatabaseCollections[CollectionName]["schema"]["jsonSchema"]
    >
  ) => RxQuery<
    MyDatabaseCollections[CollectionName]["schema"]["jsonSchema"],
    RxDocument<MyDatabaseCollections[CollectionName]["schema"]["jsonSchema"]>[]
  >
):
  | RxDocument<MyDatabaseCollections[CollectionName]["schema"]["jsonSchema"]>[]
  | null {
  const [documents, setDocuments] = useState<
    | RxDocument<
        MyDatabaseCollections[CollectionName]["schema"]["jsonSchema"]
      >[]
    | null
  >(null);
  const collection = useRxCollection(collectionName);

  useEffect(() => {
    if (!collection) {
      return;
    }

    let sub: any; // Subscription
    const createQuery = () => {
      const query = queryBuilder ? queryBuilder(collection) : collection.find();
      sub = query.$.subscribe((results) => {
        setDocuments(results);
      });
    };

    createQuery();

    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [collection, queryBuilder]);

  return documents;
}

// Helper hook for a single document by ID
export function useRxDocument<
  CollectionName extends keyof MyDatabaseCollections
>(
  collectionName: CollectionName,
  docId: string
): RxDocument<
  MyDatabaseCollections[CollectionName]["schema"]["jsonSchema"]
> | null {
  const [document, setDocument] = useState<RxDocument<
    MyDatabaseCollections[CollectionName]["schema"]["jsonSchema"]
  > | null>(null);
  const collection = useRxCollection(collectionName);

  useEffect(() => {
    if (!collection || !docId) {
      return;
    }

    let sub: any; // Subscription
    const fetchDoc = async () => {
      const query = collection.findOne(docId);
      sub = query.$.subscribe((result) => {
        setDocument(result);
      });
    };

    fetchDoc();

    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [collection, docId]);

  return document;
}
