import { writable, get } from 'svelte/store';
import { db } from '$lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    displayName: string;
    photoURL?: string;
}

export const profiles = writable<Record<string, UserProfile>>({});

const unsubscribers: Record<string, () => void> = {};

export function fetchUserProfile(uid: string) {
    if (get(profiles)[uid]) return;
    if (unsubscribers[uid]) return;

    const unsub = onSnapshot(doc(db, 'users', uid), (doc) => {
        if (doc.exists()) {
            profiles.update(p => ({
                ...p,
                [uid]: { uid: doc.id, ...doc.data() } as UserProfile
            }));
        }
    }, (error) => {
        console.error(`Error fetching user profile for ${uid}:`, error);
    });

    unsubscribers[uid] = unsub;
}
