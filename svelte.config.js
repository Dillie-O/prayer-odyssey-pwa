import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-static for SPA mode on Firebase Hosting
		adapter: adapter({
			fallback: 'index.html'
		})
	}
};

export default config;
