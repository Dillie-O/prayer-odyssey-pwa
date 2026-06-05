declare module 'virtual:pwa-info' {
	export const pwaInfo:
		| {
				webManifest?: { linkTag?: string };
				registerSW?: { scriptTag?: string };
		  }
		| undefined;
}
