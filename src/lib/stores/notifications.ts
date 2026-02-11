import { writable } from 'svelte/store';
import { messaging, db, auth } from '$lib/firebase';
import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';

export interface AppNotification {
    id: string;
    receiverId: string;
    senderId: string;
    senderName: string;
    type: 'prayer_reaction' | 'group_invite' | 'prayer_update' | 'prayer_answered' | 'prayer_shared';
    prayerId?: string;
    prayerSummary?: string;
    groupId?: string;
    groupName?: string;
    read: boolean;
    createdAt: any;
}

export const notificationPermission = writable<NotificationPermission>('default');
export const fcmToken = writable<string | null>(null);
export const notifications = writable<AppNotification[]>([]);
export const unreadCount = writable(0);



export const sendNotification = async (receiverId: string, type: AppNotification['type'], prayerId?: string, prayerSummary?: string, groupId?: string, groupName?: string) => {
    if (!auth.currentUser) return;

    await addDoc(collection(db, 'notifications'), {
        receiverId,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'Someone',
        type,
        ...(prayerId ? { prayerId } : {}),
        ...(prayerSummary ? { prayerSummary } : {}),
        ...(groupId ? { groupId } : {}),
        ...(groupName ? { groupName } : {}),
        read: false,
        createdAt: serverTimestamp()
    });
};

export const notifyGroupMembersPrayerShared = async (prayerId: string, prayerSummary: string, sharedWith: string[]) => {
    if (!auth.currentUser) return;

    try {
        // Get all groups that this prayer is shared with
        const groupPromises = sharedWith.map(async (groupId) => {
            const groupDoc = await getDoc(doc(db, 'groups', groupId));
            
            if (groupDoc.exists()) {
                const groupData = groupDoc.data();
                const members = groupData.members || [];
                const groupName = groupData.name || 'Unknown Group';
                
                // Send notification to all members except prayer owner
                const notifications = members
                    .filter((memberId: string) => memberId !== auth.currentUser?.uid) // Exclude prayer owner
                    .map((memberId: string) => 
                        sendNotification(
                            memberId, 
                            'prayer_shared', 
                            prayerId, 
                            prayerSummary, 
                            groupId, 
                            groupName
                        )
                    );
                
                return Promise.all(notifications);
            }
            return [];
        });

        await Promise.all(groupPromises);
        console.log('Notifications sent to group members for shared prayer');
    } catch (error) {
        console.error('Error sending group notifications for shared prayer:', error);
    }
};

export const notifyGroupMembersPrayerAnswered = async (prayerId: string, prayerSummary: string, sharedWith: string[]) => {
    if (!auth.currentUser) return;

    try {
        // Get all groups that this prayer is shared with
        const groupPromises = sharedWith.map(async (groupId) => {
            const groupDoc = await doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupDoc);
            
            if (groupSnap.exists()) {
                const groupData = groupSnap.data();
                const members = groupData.members || [];
                const groupName = groupData.name || 'Unknown Group';
                
                // Send notification to all members except the prayer owner
                const notifications = members
                    .filter((memberId: string) => memberId !== auth.currentUser?.uid) // Exclude prayer owner
                    .map((memberId: string) => 
                        sendNotification(
                            memberId, 
                            'prayer_answered', 
                            prayerId, 
                            prayerSummary, 
                            groupId, 
                            groupName
                        )
                    );
                
                return Promise.all(notifications);
            }
            return [];
        });

        await Promise.all(groupPromises);
        console.log('Notifications sent to group members for answered prayer');
    } catch (error) {
        console.error('Error sending group notifications for answered prayer:', error);
    }
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

export const clearAllNotifications = async () => {
    if (!auth.currentUser) return;

    try {
        // Get all notifications for current user
        const q = query(
            collection(db, 'notifications'),
            where('receiverId', '==', auth.currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        // Delete all notifications in batch
        querySnapshot.forEach((docSnapshot) => {
            batch.delete(docSnapshot.ref);
        });
        
        await batch.commit();
        console.log(`Cleared ${querySnapshot.size} notifications for user`);
    } catch (error) {
        console.error('Error clearing all notifications:', error);
        throw error;
    }
};

export const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !messaging) return;

    try {
        const permission = await Notification.requestPermission();
        notificationPermission.set(permission);

        if (permission === 'granted') {
            // Clean up stale tokens before getting new one
            await cleanupStaleTokens();
            
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

export const disableFCMNotifications = async () => {
    if (typeof window === 'undefined' || !messaging) return;

    try {
        const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });

        if (currentToken && auth.currentUser) {
            // Remove token from user profile
            await removeTokenFromProfile(currentToken);
            
            // Delete token from FCM
            await deleteToken(messaging);
            
            // Update local state - note: we don't change browser permission
            // The browser permission remains 'granted' but we track FCM state separately
            fcmToken.set(null);
        }
    } catch (error) {
        console.error('Error disabling FCM notifications:', error);
        throw error;
    }
};

export const clearAllFCMTokens = async () => {
    if (!auth.currentUser) return;

    try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        // Clear all FCM tokens and token info for this user
        await updateDoc(userRef, {
            fcmTokens: [],
            fcmTokenInfo: {},
            lastTokenSync: serverTimestamp(),
            lastTokenCleanup: serverTimestamp()
        });
        
        // Also delete current device's FCM token if it exists
        if (typeof window !== 'undefined' && messaging) {
            try {
                const currentToken = await getToken(messaging, {
                    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
                });
                if (currentToken) {
                    await deleteToken(messaging);
                }
            } catch (error) {
                console.log('No current FCM token to delete:', error);
            }
        }
        
        // Update local state
        fcmToken.set(null);
        console.log('All FCM tokens cleared for user');
    } catch (error) {
        console.error('Error clearing all FCM tokens:', error);
        throw error;
    }
};

const removeTokenFromProfile = async (token: string) => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
        await updateDoc(userRef, {
            fcmTokens: arrayRemove(token),
            lastTokenSync: serverTimestamp()
        });
        
        // Also remove token info
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const tokenInfo = userData.fcmTokenInfo || {};
            const updatedTokenInfo = { ...tokenInfo };
            delete updatedTokenInfo[token];
            
            await updateDoc(userRef, {
                fcmTokenInfo: updatedTokenInfo
            });
        }
        
        console.log('FCM Token removed from profile');
    } catch (e) {
        console.error("Error removing token from profile", e);
        throw e;
    }
};

const getDeviceInfo = () => {
    if (typeof window === 'undefined') return null;
    
    return {
        platform: navigator.platform,
        userAgent: navigator.userAgent.substring(0, 100), // Truncated for privacy
        isPWA: window.matchMedia('(display-mode: standalone)').matches,
        isStandalone: (window.navigator as any).standalone || false,
        timestamp: new Date().toISOString()
    };
};

const cleanupStaleTokens = async () => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const tokens = userData.fcmTokens || [];
        const tokenInfo = userData.fcmTokenInfo || {};

        // Remove tokens older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const validTokens: string[] = [];
        const validTokenInfo: any = {};

        for (const token of tokens) {
            const info = tokenInfo[token];
            if (info && info.createdAt && info.createdAt.toDate) {
                const createdDate = info.createdAt.toDate();
                if (createdDate > thirtyDaysAgo) {
                    validTokens.push(token);
                    validTokenInfo[token] = info;
                }
            } else {
                // Keep tokens without creation info (legacy support)
                validTokens.push(token);
                if (info) validTokenInfo[token] = info;
            }
        }

        // Update with cleaned tokens
        const { setDoc } = await import('firebase/firestore');
        await setDoc(userRef, {
            fcmTokens: validTokens,
            fcmTokenInfo: validTokenInfo,
            lastTokenCleanup: serverTimestamp()
        }, { merge: true });

        console.log(`Cleaned up ${tokens.length - validTokens.length} stale FCM tokens`);
    } catch (e) {
        console.error("Error cleaning up stale tokens", e);
    }
};

const saveTokenToProfile = async (token: string) => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
        // Get current user data to check for duplicates
        const userDoc = await getDoc(userRef);
        const userData = userDoc.exists() ? userDoc.data() : { fcmTokens: [], fcmTokenInfo: {} };
        const existingTokens = userData.fcmTokens || [];
        const tokenInfo = userData.fcmTokenInfo || {};

        // Check if token already exists
        if (existingTokens.includes(token)) {
            console.log('FCM Token already exists in profile');
            return;
        }

        // Clean up old tokens (keep only last 10 tokens per user)
        const cleanedTokens = existingTokens.slice(-9); // Keep last 9, will add 1 more = 10 total
        
        // Add new token with device info
        const updatedTokens = [...cleanedTokens, token];
        const deviceInfo = getDeviceInfo();
        
        const updatedTokenInfo = {
            ...tokenInfo,
            [token]: {
                ...deviceInfo,
                createdAt: serverTimestamp(),
                lastUsed: serverTimestamp()
            }
        };

        // Use setDoc with merge to ensure doc exists
        const { setDoc } = await import('firebase/firestore');
        await setDoc(userRef, {
            fcmTokens: updatedTokens,
            fcmTokenInfo: updatedTokenInfo,
            lastTokenSync: serverTimestamp()
        }, { merge: true });
        console.log('FCM Token synced to profile with device info');
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
            const url = payload.data?.url;

            const notification = new Notification(title, {
                body,
                icon: '/prayer_icon_logo_192.png',
                tag: 'prayer-odyssey-notification' // Prevent duplicate overlapping
            });

            // Add click handler for navigation if URL is provided
            if (url) {
                notification.onclick = () => {
                    // Focus the window first
                    window.focus();
                    
                    // Navigate to the URL
                    window.location.href = url;
                    
                    // Close the notification
                    notification.close();
                };
            }
        }
    });
}
