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
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';

const getCollection = (path: string) => collection(db, path);

export async function fetchDocs<T>(
  collectionPath: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(getCollection(collectionPath), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
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

export { where, orderBy, query };
