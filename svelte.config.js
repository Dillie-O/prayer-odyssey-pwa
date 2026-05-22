import adapter from '@sveltejs/adapter-static';

const appVersion = process.env.npm_package_version ?? '0.0.0';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		version: {
			name: appVersion
		},
		// adapter-static for SPA mode on Firebase Hosting
		adapter: adapter({
			fallback: 'index.html'
		})
	}
};

export default config;
