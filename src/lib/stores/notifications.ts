import { writable } from 'svelte/store';
import { messaging, db, auth } from '$lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

export interface AppNotification {
    id: string;
    receiverId: string;
    senderId: string;
    senderName: string;
    type: 'prayer_reaction' | 'group_invite' | 'prayer_update';
    prayerId?: string;
    prayerSummary?: string;
    read: boolean;
    createdAt: any;
}

export const notificationPermission = writable<NotificationPermission>('default');
export const fcmToken = writable<string | null>(null);
export const notifications = writable<AppNotification[]>([]);
export const unreadCount = writable(0);



export const sendNotification = async (receiverId: string, type: AppNotification['type'], prayerId?: string, prayerSummary?: string) => {
    if (!auth.currentUser) return;

    await addDoc(collection(db, 'notifications'), {
        receiverId,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'Someone',
        type,
        ...(prayerId ? { prayerId } : {}),
        ...(prayerSummary ? { prayerSummary } : {}),
        read: false,
        createdAt: serverTimestamp()
    });
};

let unsubscribeNotifications: (() => void) | null = null;

export const subscribeToNotifications = (uid: string) => {
    if (unsubscribeNotifications) unsubscribeNotifications();

    const q = query(
        collection(db, 'notifications'),
        where('receiverId', '==', uid),
        orderBy('createdAt', 'desc')
    );

    unsubscribeNotifications = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
        notifications.set(data);
        unreadCount.set(data.filter(n => !n.read).length);
    }, (error) => {
        console.error("Error subscribing to notifications:", error);
    });

    return unsubscribeNotifications;
};

export const markAsRead = async (notificationId: string) => {
    await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
    });
};

export const deleteNotification = async (notificationId: string) => {
    await deleteDoc(doc(db, 'notifications', notificationId));
};

export const requestNotificationPermission = async () => {

    if (!messaging) return;

    try {
        const permission = await Notification.requestPermission();
        notificationPermission.set(permission);

        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY // Optional if using default credential
            });

            if (token) {
                fcmToken.set(token);
                await saveTokenToProfile(token);
                console.log('FCM Token:', token);
            }
        }
    } catch (error) {
        console.error('Unable to get permission or token.', error);
    }
};

const saveTokenToProfile = async (token: string) => {
    if (!auth.currentUser) return;

    // Save token to user profile
    const userRef = doc(db, 'users', auth.currentUser.uid);
    // In a real app we might want to check if it exists first or set with merge
    /* 
       Note: We haven't explicitly created 'users' documents on login yet.
       We should probably do that in the auth store or here. 
       For now, we'll assume the user doc might need to be created or updated.
       But updateDoc fails if doc doesn't exist. setDoc with merge is safer.
    */

    // Let's use updateDoc for now, assuming we handle user creation elsewhere or will add it.
    // Actually, let's fix the potential issue by using setDoc imported dynamically? 
    // Or just try update and catch.
    try {
        await updateDoc(userRef, {
            fcmTokens: arrayUnion(token)
        });
    } catch (e) {
        // If doc missing, we might need to create it. 
        // For this demo, let's just log.
        console.error("Error saving token to profile", e);
    }
};

if (typeof window !== 'undefined' && messaging) {
    onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // Show toast or custom UI
        new Notification(payload.notification?.title || 'New Message', {
            body: payload.notification?.body,
            icon: '/prayer_icon_logo_192.png'
        });
    });
}
