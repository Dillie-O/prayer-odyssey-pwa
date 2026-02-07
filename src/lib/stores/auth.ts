import { writable } from 'svelte/store';
import { auth } from '$lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { browser } from '$app/environment';

export const user = writable<User | null>(null);
export const loading = writable(true);

if (browser) {
    onAuthStateChanged(auth, (u) => {
        user.set(u);
        loading.set(false);
    });
}

export const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

export const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(result.user, { displayName: name });
        // Force refresh user to get display name
        user.set(auth.currentUser);
    } catch (error) {
        console.error("Registration failed", error);
        throw error;
    }
};

export const loginWithEmail = async (email: string, pass: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed", error);
    }
};
