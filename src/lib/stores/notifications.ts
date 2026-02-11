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
    if (typeof window === 'undefined' || !messaging) return;

    try {
        const permission = await Notification.requestPermission();
        notificationPermission.set(permission);

        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
            });

            if (token) {
                fcmToken.set(token);
                await saveTokenToProfile(token);
            }
        }
    } catch (error) {
        console.error('Unable to get permission or token.', error);
    }
};

const saveTokenToProfile = async (token: string) => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
        // Use setDoc with merge to ensure doc exists
        const { setDoc } = await import('firebase/firestore');
        await setDoc(userRef, {
            fcmTokens: arrayUnion(token),
            lastTokenSync: serverTimestamp()
        }, { merge: true });
        console.log('FCM Token synced to profile');
    } catch (e) {
        console.error("Error saving token to profile", e);
    }
};

if (typeof window !== 'undefined' && messaging) {
    onMessage(messaging, (payload) => {
        console.log('Foreground Message received: ', payload);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
            const title = payload.notification?.title || 'New Message';
            const body = payload.notification?.body || 'You have a new notification';

            new Notification(title, {
                body,
                icon: '/prayer_icon_logo_192.png',
                tag: 'prayer-odyssey-notification' // Prevent duplicate overlapping
            });
        }
    });
}
