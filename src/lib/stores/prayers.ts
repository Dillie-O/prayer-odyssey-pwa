import { writable } from 'svelte/store';
import { db, auth } from '$lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { user } from './auth';

export interface Prayer {
    id: string;
    content: string;
    ownerId: string;
    status: 'active' | 'answered' | 'archived';
    createdAt: Timestamp;
    sharedWith: string[]; // groupIds
}

export const prayers = writable<Prayer[]>([]);
export const loadingPrayers = writable(false);

let unsubscribe: () => void;

user.subscribe(u => {
    if (unsubscribe) unsubscribe();

    if (u) {
        loadingPrayers.set(true);
        const q = query(
            collection(db, 'prayers'),
            where('ownerId', '==', u.uid),
            orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Prayer));
            prayers.set(data);
            loadingPrayers.set(false);
        }, (error) => {
            console.error("Error fetching prayers:", error);
            loadingPrayers.set(false);
        });
    } else {
        prayers.set([]);
    }
});

export const addPrayer = async (content: string, sharedWith: string[] = []) => {
    if (!auth.currentUser) throw new Error("User not logged in");

    await addDoc(collection(db, 'prayers'), {
        content,
        ownerId: auth.currentUser.uid,
        status: 'active',
        createdAt: serverTimestamp(),
        sharedWith
    });
};

export const deletePrayer = async (id: string) => {
    if (!auth.currentUser) throw new Error("User not logged in");
    await deleteDoc(doc(db, 'prayers', id));
};

export const markAnswered = async (id: string) => {
    await updateDoc(doc(db, 'prayers', id), {
        status: 'answered'
    });
};
