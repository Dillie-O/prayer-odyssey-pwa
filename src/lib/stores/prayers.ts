import { writable } from 'svelte/store';
import { db, auth } from '$lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { user } from './auth';

export interface Prayer {
    id: string;
    summary: string;
    description?: string;
    ownerId: string;
    status: 'active' | 'answered' | 'archived';
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    sharedWith: string[]; // groupIds
}

export interface PrayerUpdate {
    id: string;
    prayerId: string;
    content: string;
    authorId: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
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

export const addPrayer = async (summary: string, description?: string, sharedWith: string[] = []) => {
    if (!auth.currentUser) throw new Error("User not logged in");

    await addDoc(collection(db, 'prayers'), {
        summary,
        ...(description ? { description } : {}),
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

export const updatePrayer = async (id: string, summary: string, description?: string) => {
    if (!auth.currentUser) throw new Error("User not logged in");
    await updateDoc(doc(db, 'prayers', id), {
        summary,
        ...(description ? { description } : {}),
        updatedAt: serverTimestamp()
    });
};

export const markAnswered = async (id: string) => {
    await updateDoc(doc(db, 'prayers', id), {
        status: 'answered'
    });
};

// Prayer Updates
export const prayerUpdates = writable<Record<string, PrayerUpdate[]>>({});

export const subscribeToPrayerUpdates = (prayerId: string) => {
    const q = query(
        collection(db, 'prayers', prayerId, 'updates'),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const updates = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PrayerUpdate));
        prayerUpdates.update(current => ({
            ...current,
            [prayerId]: updates
        }));
    });
};

export const addPrayerUpdate = async (prayerId: string, content: string) => {
    if (!auth.currentUser) throw new Error("User not logged in");

    await addDoc(collection(db, 'prayers', prayerId, 'updates'), {
        prayerId,
        content,
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp()
    });
};

export const editPrayerUpdate = async (prayerId: string, updateId: string, content: string) => {
    if (!auth.currentUser) throw new Error("User not logged in");
    await updateDoc(doc(db, 'prayers', prayerId, 'updates', updateId), {
        content,
        updatedAt: serverTimestamp()
    });
};

export const deletePrayerUpdate = async (prayerId: string, updateId: string) => {
    if (!auth.currentUser) throw new Error("User not logged in");
    await deleteDoc(doc(db, 'prayers', prayerId, 'updates', updateId));
};
