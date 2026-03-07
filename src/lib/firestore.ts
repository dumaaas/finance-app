import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryConstraint,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

const getCollection = (path: string) => collection(db, path);

export async function fetchDocs<T>(
  collectionPath: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  try {
    const q = query(getCollection(collectionPath), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
  } catch (error) {
    console.error(`[Firestore] Error fetching "${collectionPath}":`, error);
    throw error;
  }
}

export async function fetchDoc<T>(
  collectionPath: string,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionPath, docId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T;
}

export async function createDoc(
  collectionPath: string,
  data: DocumentData
): Promise<string> {
  const docRef = await addDoc(getCollection(collectionPath), data);
  return docRef.id;
}

export async function updateDocument(
  collectionPath: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionPath, docId);
  await updateDoc(docRef, data);
}

export async function deleteDocument(
  collectionPath: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionPath, docId);
  await deleteDoc(docRef);
}

export interface PaginatedResult<T> {
  items: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

export async function fetchPaginatedDocs<T>(
  collectionPath: string,
  pageSize: number,
  cursor: DocumentSnapshot | null,
  ...constraints: QueryConstraint[]
): Promise<PaginatedResult<T>> {
  try {
    const parts: QueryConstraint[] = [...constraints, limit(pageSize + 1)];
    if (cursor) {
      parts.push(startAfter(cursor));
    }
    const q = query(getCollection(collectionPath), ...parts);
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const sliced = hasMore ? docs.slice(0, pageSize) : docs;
    return {
      items: sliced.map((d) => ({ id: d.id, ...d.data() } as T)),
      lastDoc: sliced.length > 0 ? sliced[sliced.length - 1] : null,
      hasMore,
    };
  } catch (error) {
    console.error(`[Firestore] Error fetching paginated "${collectionPath}":`, error);
    throw error;
  }
}

export { where, orderBy, limit, startAfter, query };
