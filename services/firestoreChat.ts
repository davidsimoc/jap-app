import { db } from '@/firebaseConfig';
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

export async function createConversation(userId: string, title: string) {
  const ref = await addDoc(collection(db, 'conversations'), {
    userId,
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function listConversations(
  userId: string,
  onChange: (items: any[]) => void,
) {
  const q = query(
    collection(db, 'conversations'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onChange(items);
  });
}

export async function updateConversationTitle(
  conversationId: string,
  title: string,
) {
  await updateDoc(doc(db, 'conversations', conversationId), {
    title,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteConversation(conversationId: string) {
  const msgsRef = collection(db, 'conversations', conversationId, 'messages');
  const msgsSnap = await getDocs(msgsRef);
  const batch = writeBatch(db);
  msgsSnap.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'conversations', conversationId));
  await batch.commit();
}

export function listenMessages(
  conversationId: string,
  onChange: (msgs: any[]) => void,
) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onChange(items);
  });
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'model',
  text: string,
) {
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    role,
    text,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'conversations', conversationId), {
    updatedAt: serverTimestamp(),
  });
}