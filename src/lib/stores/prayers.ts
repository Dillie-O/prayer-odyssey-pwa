import { writable, derived, get } from 'svelte/store';
import { db, auth } from '$lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc, serverTimestamp, type Timestamp, or, arrayUnion } from 'firebase/firestore';
import { user } from './auth';
import { groups as groupsStore } from './groups';

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

// Function to start the prayers subscription
const subscribeToPrayers = (u: any, userGroupIds: string[]) => {
    if (unsubscribe) unsubscribe();

    if (u) {
        loadingPrayers.set(true);

        // Build the query: owner check OR shared with groups user is in
        let q;
        if (userGroupIds.length > 0) {
            q = query(
                collection(db, 'prayers'),
                or(
                    where('ownerId', '==', u.uid),
                    where('sharedWith', 'array-contains-any', userGroupIds)
                ),
                orderBy('createdAt', 'desc')
            );
        } else {
            q = query(
                collection(db, 'prayers'),
                where('ownerId', '==', u.uid),
                orderBy('createdAt', 'desc')
            );
        }

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
};

// Subscribe to both user and groups to restart the subscription when they change
let currentUser: any = null;
user.subscribe(u => {
    currentUser = u;
    const groupIds = get(groupsStore).map(g => g.id);
    subscribeToPrayers(u, groupIds);
});

groupsStore.subscribe(gs => {
    if (currentUser) {
        const groupIds = gs.map(g => g.id);
        subscribeToPrayers(currentUser, groupIds);
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

export const updatePrayerSharing = async (prayerId: string, groupIds: string[]) => {
    if (!auth.currentUser) throw new Error("User not logged in");
    await updateDoc(doc(db, 'prayers', prayerId), {
        sharedWith: groupIds,
        updatedAt: serverTimestamp()
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

export const markActive = async (id: string) => {
    await updateDoc(doc(db, 'prayers', id), {
        status: 'active'
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
