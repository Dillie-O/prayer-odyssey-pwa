import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getMessaging, type Messaging } from 'firebase/messaging';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let messaging: Messaging | null = null;
let analytics: Analytics | null = null;

import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
auth = getAuth(app);

// Initialize Firestore with offline persistence
db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

if (typeof window !== 'undefined') {
    // Analytics
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        console.error('Firebase Analytics failed to initialize', e);
    }

    // Messaging
    if ('serviceWorker' in navigator) {
        try {
            messaging = getMessaging(app);
        } catch (e) {
            console.error('Firebase Messaging failed to initialize', e);
        }
    }
}

export { app, auth, db, messaging, analytics };
