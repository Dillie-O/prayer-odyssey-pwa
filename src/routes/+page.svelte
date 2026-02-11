<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	onMount(() => {
		if ($user) {
			goto('/prayers');
		}
	});

	$effect(() => {
		if ($user) {
			goto('/prayers');
		}
	});
</script>

<!-- Public Landing Page -->
<div class="py-24 text-center">
	<h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl bg-gradient-to-r from-indigo-200 to-indigo-500 bg-clip-text text-transparent">Prayer Odyssey</h1>
	<p class="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
		Track your spiritual journey, create prayer groups, and encourage one another with real-time notifications.
	</p>
	<div class="mt-10 flex items-center justify-center gap-x-6">
		{#if $user}
			<a href="/prayers" class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all hover:scale-105">View Your Prayers</a>
		{:else}
			<a href="/login" class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all hover:scale-105">Get started</a>
		{/if}
		<a href="/about" class="text-sm font-semibold leading-6 text-white hover:text-indigo-300 transition-colors">Learn more <span aria-hidden="true">→</span></a>
	</div>
	
	<!-- Features Grid -->
	<div class="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-3 text-left">
		<div class="rounded-2xl bg-white/5 p-8 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
			<div class="mb-4 inline-block rounded-lg bg-indigo-500/20 p-3 text-indigo-400">
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
			</div>
			<h3 class="text-lg font-semibold text-white">Track Prayers</h3>
			<p class="mt-2 text-gray-400">Keep a private or shared journal of your prayer requests and answered prayers.</p>
		</div>
		 <div class="rounded-2xl bg-white/5 p-8 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
			<div class="mb-4 inline-block rounded-lg bg-indigo-500/20 p-3 text-indigo-400">
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
			</div>
			<h3 class="text-lg font-semibold text-white">Groups</h3>
			<p class="mt-2 text-gray-400">Create small groups to share requests securely with trusted friends.</p>
		</div>
		 <div class="rounded-2xl bg-white/5 p-8 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
			<div class="mb-4 inline-block rounded-lg bg-indigo-500/20 p-3 text-indigo-400">
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
			</div>
			<h3 class="text-lg font-semibold text-white">Notifications</h3>
			<p class="mt-2 text-gray-400">Let others know you prayed for them with a single tap.</p>
		</div>
	</div>
</div>

