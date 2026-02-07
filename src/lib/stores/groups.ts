import { writable } from 'svelte/store';
import { db, auth } from '$lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, type Timestamp, serverTimestamp } from 'firebase/firestore';
import { user } from './auth';

export interface Group {
    id: string;
    name: string;
    description?: string;
    admins: string[]; // userIds
    members: string[]; // userIds
    createdAt: Timestamp;
}

export const groups = writable<Group[]>([]);
export const loadingGroups = writable(false);

let unsubscribe: () => void;

user.subscribe(u => {
    if (unsubscribe) unsubscribe();

    if (u) {
        loadingGroups.set(true);
        // Query groups where the user is listed in the 'members' array
        const q = query(
            collection(db, 'groups'),
            where('members', 'array-contains', u.uid)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Group));
            groups.set(data);
            loadingGroups.set(false);
        }, (error) => {
            console.error("Error fetching groups:", error);
            loadingGroups.set(false);
        });
    } else {
        groups.set([]);
    }
});

export const createGroup = async (name: string, description: string = '') => {
    if (!auth.currentUser) throw new Error("User not logged in");

    await addDoc(collection(db, 'groups'), {
        name,
        description,
        admins: [auth.currentUser.uid],
        members: [auth.currentUser.uid],
        createdAt: serverTimestamp()
    });
};

export const joinGroup = async (groupId: string) => {
    if (!auth.currentUser) throw new Error("User not logged in");

    const groupRef = doc(db, 'groups', groupId);
    /* In a real app, you'd probably want an invite system or check visibility. 
       For now, we'll assume open join if they have the ID (or we can implement invites later). */
    await updateDoc(groupRef, {
        members: arrayUnion(auth.currentUser.uid)
    });
};
