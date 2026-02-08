/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBeUvGy9EJnSpidHtowReLC0Ded5kQxc-s",
    authDomain: "prayer-odyssey-96025.firebaseapp.com",
    projectId: "prayer-odyssey-96025",
    storageBucket: "prayer-odyssey-96025.firebasestorage.app",
    messagingSenderId: "14697961820",
    appId: "1:14697961820:web:7cb79d83090779800c0999"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Add empty fetch listener to satisfy Chrome's PWA requirement
self.addEventListener('fetch', (event) => {
    // This can be empty, but it MUST exist for the PWA to be installable in some browsers
});

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/prayer_icon_logo_192.png'
    };

    self.registration.showNotification(notificationTitle,
        notificationOptions);
});
