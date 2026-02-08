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
				short_name: 'PrayerOdyssey',
				description: 'Track your prayers and share with groups.',
				theme_color: '#ffffff',
				icons: [
					{
						src: 'prayer_icon_logo_192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'prayer_icon_logo_512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			}
		})
	]
});
