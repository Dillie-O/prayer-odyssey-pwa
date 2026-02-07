<script lang="ts">
	import { deletePrayer, markAnswered, subscribeToPrayerUpdates, prayerUpdates, type Prayer } from '$lib/stores/prayers';
	import { onMount, onDestroy } from 'svelte';
	import EditPrayerModal from './EditPrayerModal.svelte';
	import PrayerUpdates from './PrayerUpdates.svelte';
    
    let { prayer } = $props<{ prayer: Prayer }>();
	let showEditModal = $state(false);
	let showUpdates = $state(false);
	let unsubscribe: (() => void) | null = null;
	
	// Use $derived instead of $: for Svelte 5 runes mode
	let updates = $derived($prayerUpdates[prayer.id] || []);
    
    async function handleDelete() {
        if (confirm('Are you sure you want to delete this prayer?')) {
            await deletePrayer(prayer.id);
        }
    }

    async function handleAnswered() {
        await markAnswered(prayer.id);
    }
	
	onMount(() => {
		unsubscribe = subscribeToPrayerUpdates(prayer.id);
	});
	
	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});
</script>

<div class="relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6 backdrop-blur-sm transition-all hover:bg-slate-900/80 hover:border-indigo-500/30 group">
    <div class="flex justify-between items-start">
		<div class="flex-1">
			{#if prayer.summary && prayer.description}
				<!-- New format with summary and description -->
				<h4 class="text-xl font-semibold text-white mb-2">{prayer.summary}</h4>
				<p class="text-slate-300 leading-relaxed whitespace-pre-wrap">{prayer.description}</p>
			{:else if (prayer as any).content}
				<!-- Old format with just content - fallback for existing prayers -->
				<p class="text-lg text-slate-200 leading-relaxed whitespace-pre-wrap">{(prayer as any).content}</p>
			{:else}
				<!-- No content at all -->
				<p class="text-slate-500 italic">No content available</p>
			{/if}
		</div>
        
        <div class="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
			<button 
				onclick={() => showEditModal = true}
				class="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full transition-colors"
				title="Edit Prayer"
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
				</svg>
			</button>
			
            {#if prayer.status !== 'answered'}
                <button 
                    onclick={handleAnswered}
                    class="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 rounded-full transition-colors"
                    title="Mark as Answered"
                >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            {/if}
            
            <button 
                onclick={handleDelete}
                class="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-full transition-colors"
                title="Delete"
            >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    </div>
    
    <div class="mt-4 flex items-center justify-between">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset {prayer.status === 'answered' ? 'bg-green-400/10 text-green-400 ring-green-400/20' : 'bg-indigo-400/10 text-indigo-400 ring-indigo-400/30'}">
            {prayer.status.charAt(0).toUpperCase() + prayer.status.slice(1)}
        </span>
        <span class="text-xs text-slate-500">
            {prayer.createdAt?.toDate().toLocaleDateString() || 'Just now'}
        </span>
    </div>
	
	{#if updates.length > 0}
		<div class="mt-4 pt-4 border-t border-white/10">
			<button 
				onclick={() => showUpdates = !showUpdates}
				class="flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
			>
				<svg class="w-4 h-4 mr-1 transition-transform {showUpdates ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
				{updates.length} {updates.length === 1 ? 'Update' : 'Updates'}
			</button>
		</div>
	{/if}
</div>

{#if showUpdates}
	<PrayerUpdates prayerId={prayer.id} {updates} bind:isOpen={showUpdates} />
{/if}

<EditPrayerModal {prayer} bind:isOpen={showEditModal} />
