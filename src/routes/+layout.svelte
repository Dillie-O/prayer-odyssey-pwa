<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import { user, loading } from '$lib/stores/auth';
	import favicon from '$lib/assets/prayer_logo.svg';
	import { pwaInfo } from 'virtual:pwa-info';

	import { requestNotificationPermission } from '$lib/stores/notifications';

	let { children } = $props();

	// Request notification permission when user is logged in
	$effect(() => {
		if ($user) {
			requestNotificationPermission();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html pwaInfo?.webManifest?.linkTag}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html pwaInfo?.registerSW?.scriptTag}
</svelte:head>

<div
	class="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white dark:bg-slate-950 dark:text-slate-50"
>
	<Navbar />

	<main class="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 sm:pb-6 lg:px-8">
		{#if $loading}
			<div class="flex h-[calc(100vh-4rem)] items-center justify-center">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
				></div>
			</div>
		{:else}
			{@render children()}
		{/if}
	</main>

	<BottomNav />
</div>
