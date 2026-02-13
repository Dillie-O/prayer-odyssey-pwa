<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { prayers, loadingPrayers } from '$lib/stores/prayers';
	import AddPrayerModal from '$lib/components/AddPrayerModal.svelte';
	import PrayerCard from '$lib/components/PrayerCard.svelte';
	import PrayerCarousel from '$lib/components/PrayerCarousel.svelte';
	
	let isModalOpen = $state(false);
	let filter = $state<'all' | 'active' | 'answered'>('active');
	let viewMode = $state<'list' | 'carousel'>('list');
	
	let filteredPrayers = $derived($prayers.filter(p => {
        // Only show personal prayers in this view
        if (p.ownerId !== $user?.uid) return false;
		if (filter === 'all') return true;
		return p.status === filter;
	}));
</script>

<AddPrayerModal bind:isOpen={isModalOpen} />

{#if $user}
	<div class="space-y-6">
		<header class="flex items-center justify-between">
			<h1 class="text-3xl font-bold text-white">My Prayers</h1>
			<button 
                onclick={() => isModalOpen = true}
                class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors whitespace-nowrap"
            >
				+ New Prayer
			</button>
		</header>

		<!-- Filter Tabs with View Toggle -->
		<div class="flex items-center justify-between">
			<!-- Filter Buttons -->
			<div class="flex items-center space-x-1 rounded-xl bg-slate-900/50 p-1 border border-white/5 backdrop-blur-sm">
				<button 
					onclick={() => filter = 'active'}
					class="px-4 py-2 text-sm font-medium rounded-lg transition-all {filter === 'active' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
				>
					Active
				</button>
				<button 
					onclick={() => filter = 'answered'}
					class="px-4 py-2 text-sm font-medium rounded-lg transition-all {filter === 'answered' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
				>
					Answered
				</button>
				<button 
					onclick={() => filter = 'all'}
					class="px-4 py-2 text-sm font-medium rounded-lg transition-all {filter === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
				>
					All
				</button>
			</div>
			
			<!-- View Toggle Buttons -->
			<div class="flex items-center space-x-1 rounded-xl bg-slate-900/50 p-1 border border-white/5 backdrop-blur-sm">
				<button 
					onclick={() => viewMode = 'list'}
					class="px-3 py-2 text-sm font-medium rounded-lg transition-all {viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
					title="List view"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				<button 
					onclick={() => viewMode = 'carousel'}
					class="px-3 py-2 text-sm font-medium rounded-lg transition-all {viewMode === 'carousel' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}"
					title="Carousel view"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
					</svg>
				</button>
			</div>
		</div>

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
		{:else if filteredPrayers.length === 0}
			<div class="rounded-lg border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
				<p class="text-slate-400">No {filter === 'all' ? '' : filter} prayers found.</p>
			</div>
        {:else}
            <!-- Conditional rendering based on view mode -->
            {#if viewMode === 'carousel'}
                <div class="max-w-2xl mx-auto">
                    <PrayerCarousel prayers={filteredPrayers} />
                </div>
            {:else}
                <!-- List View (existing grid layout) -->
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {#each filteredPrayers as prayer (prayer.id)}
                        <PrayerCard {prayer} showOwnerInfo={false} />
                    {/each}
                </div>
            {/if}
        {/if}
	</div>
{:else}
    <div class="py-24 text-center">
        <h2 class="text-2xl font-bold text-white">Please sign in to view your prayers</h2>
        <a href="/login" class="mt-4 inline-block text-indigo-400 hover:text-indigo-300 transition-colors">Sign in →</a>
    </div>
{/if}
