const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Triggered when a new notification document is created in Firestore.
 * Sends an FCM push notification to the receiver using modern 2nd Gen triggers.
 * This version is optimized for Node 22 and the latest Firebase SDKs.
 */
exports.sendPushNotification = onDocumentCreated("notifications/{notificationId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }

    const data = snapshot.data();
    const receiverId = data.receiverId;
    const senderName = data.senderName;
    const type = data.type;
    const prayerId = data.prayerId || null;
    const prayerSummary = data.prayerSummary || "";

    console.log(`FCM: Processing notification for ${receiverId} from ${senderName}`);

    // Fetch the receiver's tokens from the users collection
    const userRef = admin.firestore().collection("users").doc(receiverId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        console.log("No user found with ID:", receiverId);
        return;
    }

    const userData = userDoc.data();
    const tokens = userData.fcmTokens || [];

    if (tokens.length === 0) {
        console.log("No FCM tokens for user:", receiverId);
        return;
    }

    // Create notification content based on type
    let title = "New Notification";
    let body = "You have a new message in Prayer Odyssey.";

    if (type === "prayer_reaction") {
        title = "🙏 Someone is praying!";
        body = `${senderName} is praying for "${prayerSummary}"`;
    } else if (type === "prayer_update") {
        title = "📝 Prayer Update";
        body = `${senderName} added an update to "${prayerSummary}"`;
    } else if (type === "group_invite") {
        title = "👥 Group Invitation";
        body = `${senderName} invited you to join a group.`;
    }

    const message = {
        notification: {
            title: title,
            body: body,
        },
        data: {
            url: prayerId ? `/prayers/${prayerId}` : "/",
        },
        tokens: tokens,
    };

    // Send multicast message to all user devices
    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Successfully sent ${response.successCount} messages`);
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
});

/**
 * Triggered when a new update is added to a prayer.
 * Fan-out notifications to all members of groups this prayer is shared with.
 */
exports.onPrayerUpdateCreated = onDocumentCreated("prayers/{prayerId}/updates/{updateId}", async (event) => {
    const updateData = event.data?.data();
    if (!updateData) return;

    const { prayerId } = event.params;
    const authorId = updateData.authorId;

    // 1. Get the parent prayer to see which groups it's shared with
    const prayerRef = admin.firestore().collection("prayers").doc(prayerId);
    const prayerDoc = await prayerRef.get();

    if (!prayerDoc.exists) return;
    const prayerData = prayerDoc.data();
    const sharedGroups = prayerData.sharedWith || [];
    const prayerSummary = prayerData.summary;

    if (sharedGroups.length === 0) return;

    // 2. Fetch the author's name for the notification
    const authorRef = admin.firestore().collection("users").doc(authorId);
    const authorDoc = await authorRef.get();
    const authorName = authorDoc.exists ? (authorDoc.data().displayName || "Someone") : "Someone";

    // 3. For each group, find members and create notifications
    const batch = admin.firestore().batch();
    const notifiedUsers = new Set();
    notifiedUsers.add(authorId); // Don't notify the person who wrote the update

    for (const groupId of sharedGroups) {
        const groupRef = admin.firestore().collection("groups").doc(groupId);
        const groupDoc = await groupRef.get();

        if (groupDoc.exists) {
            const members = groupDoc.data().members || [];
            for (const memberId of members) {
                if (!notifiedUsers.has(memberId)) {
                    const notificationRef = admin.firestore().collection("notifications").doc();
                    batch.set(notificationRef, {
                        receiverId: memberId,
                        senderId: authorId,
                        senderName: authorName,
                        type: 'prayer_update',
                        prayerId: prayerId,
                        prayerSummary: prayerSummary,
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    notifiedUsers.add(memberId);
                }
            }
        }
    }

    if (notifiedUsers.size > 1) { // More than just the author
        await batch.commit();
        console.log(`Fanned out ${notifiedUsers.size - 1} notifications for prayer update ${event.params.updateId}`);
    }
});
