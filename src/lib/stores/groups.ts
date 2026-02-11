import { writable } from 'svelte/store';
import { db, auth } from '$lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, updateDoc, setDoc, arrayUnion, type Timestamp, serverTimestamp } from 'firebase/firestore';
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
    const uid = auth.currentUser.uid;

    const groupDoc = await addDoc(collection(db, 'groups'), {
        name,
        description,
        admins: [uid],
        members: [uid],
        createdAt: serverTimestamp()
    });

    // Update user's group list for security rules/queries
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        groups: arrayUnion(groupDoc.id)
    }).catch(async (err) => {
        // If user doc doesn't exist, create it (lazy initialization)
        if (err.code === 'not-found') {
            await setDoc(userRef, {
                groups: [groupDoc.id]
            });
        } else {
            throw err;
        }
    });
};

export const joinGroup = async (groupId: string) => {
    if (!auth.currentUser) throw new Error("User not logged in");
    const uid = auth.currentUser.uid;

    const groupRef = doc(db, 'groups', groupId);

    // Add user to group members
    await updateDoc(groupRef, {
        members: arrayUnion(uid)
    });

    // Add group to user's list
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        groups: arrayUnion(groupId)
    }).catch(async (err) => {
        if (err.code === 'not-found') {
            await setDoc(userRef, {
                groups: [groupId]
            });
        } else {
            throw err;
        }
    });
};
