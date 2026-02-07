<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { prayers, loadingPrayers } from '$lib/stores/prayers';
	import AddPrayerModal from '$lib/components/AddPrayerModal.svelte';
	import PrayerCard from '$lib/components/PrayerCard.svelte';
	
	let isModalOpen = $state(false);
</script>

<AddPrayerModal bind:isOpen={isModalOpen} />

{#if $user}
	<div class="space-y-6">
		<header class="flex items-center justify-between">
			<h1 class="text-3xl font-bold text-white">My Prayers</h1>
			<button 
                onclick={() => isModalOpen = true}
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
            >
				+ New Prayer
			</button>
		</header>

        {#if $loadingPrayers}
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {#each Array(3) as _}
                    <div class="h-32 animate-pulse rounded-xl bg-slate-800/50 border border-white/5"></div>
                {/each}
            </div>
        {:else if $prayers.length === 0}
            <div class="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div class="text-center py-12">
                    <button 
                        onclick={() => isModalOpen = true}
                        class="mx-auto block"
                        aria-label="Create new prayer"
                    >
                        <svg class="mx-auto h-12 w-12 text-gray-400 hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <h3 class="mt-2 text-sm font-semibold text-white">No prayers yet</h3>
                    <p class="mt-1 text-sm text-gray-400">Start your prayer journey by creating your first prayer request.</p>
                    <div class="mt-6">
                        <button 
                            onclick={() => isModalOpen = true}
                            class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                        >
                            <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                            </svg>
                            New Prayer
                        </button>
                    </div>
                </div>
            </div>
        {:else}
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {#each $prayers as prayer (prayer.id)}
                    <PrayerCard {prayer} />
                {/each}
            </div>
        {/if}
	</div>
{:else}
    <!-- Public Landing Page -->
	<div class="py-24 text-center">
		<h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl bg-gradient-to-r from-indigo-200 to-indigo-500 bg-clip-text text-transparent">Prayer Odyssey</h1>
		<p class="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
			Track your spiritual journey, create prayer groups, and encourage one another with real-time notifications.
		</p>
		<div class="mt-10 flex items-center justify-center gap-x-6">
			<a href="/login" class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all hover:scale-105">Get started</a>
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
{/if}
