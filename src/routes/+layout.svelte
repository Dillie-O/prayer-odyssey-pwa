<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { user, loading } from '$lib/stores/auth';
	import favicon from '$lib/assets/favicon.svg';
    
    let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="{favicon}" />
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500 selection:text-white">
	<Navbar />
	
	<main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		{#if $loading}
			<div class="flex h-[calc(100vh-4rem)] items-center justify-center">
				<div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
			</div>
		{:else}
			{@render children()}
		{/if}
	</main>
</div>
