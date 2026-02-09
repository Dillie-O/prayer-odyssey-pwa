import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Prayer Odyssey',
				short_name: 'Prayer Odyssey',
				description: 'Track your prayers and share with groups.',
				theme_color: '#ffffff',
				background_color: '#0f172a',
				display: 'standalone',
				start_url: '/',
				scope: '/',
				icons: [
					{
						src: 'prayer_icon_logo_192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: 'prayer_icon_logo_192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable'
					},
					{
						src: 'prayer_icon_logo_512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: 'prayer_icon_logo_512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				],
				screenshots: [
					{
						src: 'screenshot-desktop.png',
						sizes: '1280x720',
						type: 'image/png',
						form_factor: 'wide',
						label: 'Desktop App'
					},
					{
						src: 'screenshot-mobile.png',
						sizes: '720x1280',
						type: 'image/png',
						form_factor: 'narrow',
						label: 'Mobile App'
					}
				],
				prefer_related_applications: false
			},
			devOptions: {
				enabled: true
			},
			workbox: {
				importScripts: ['/firebase-messaging-sw.js'],
				globPatterns: ['**/*.{js,css,html,png,svg,ico}']
			}
		})
	]
});
