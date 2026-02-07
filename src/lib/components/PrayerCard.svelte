<script lang="ts">
	import { markAnswered, subscribeToPrayerUpdates, prayerUpdates, type Prayer } from '$lib/stores/prayers';
	import { onMount, onDestroy } from 'svelte';
    
    let { prayer } = $props<{ prayer: Prayer }>();
	let unsubscribe: (() => void) | null = null;
	
	// Use $derived instead of $: for Svelte 5 runes mode
	let updates = $derived($prayerUpdates[prayer.id] || []);

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
		<!-- Clickable prayer content -->
		<a href="/prayers/{prayer.id}" class="flex-1 cursor-pointer">
			{#if prayer.summary && prayer.description}
				<!-- New format with summary and description -->
				<h4 class="text-xl font-semibold text-white mb-2 hover:text-indigo-300 transition-colors">{prayer.summary}</h4>
				<p class="text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-3">{prayer.description}</p>
			{:else if (prayer as any).content}
				<!-- Old format with just content - fallback for existing prayers -->
				<p class="text-lg text-slate-200 leading-relaxed whitespace-pre-wrap line-clamp-3">{(prayer as any).content}</p>
			{:else}
				<!-- No content at all -->
				<p class="text-slate-500 italic">No content available</p>
			{/if}
		</a>
        
        <div class="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {#if prayer.status !== 'answered'}
                <button 
                    onclick={(e) => { e.preventDefault(); e.stopPropagation(); handleAnswered(); }}
                    class="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 rounded-full transition-colors"
                    title="Mark as Answered"
                >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </button>
            {/if}
        </div>
    </div>
    
    <div class="mt-4 flex items-center justify-between">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset {prayer.status === 'answered' ? 'bg-green-400/10 text-green-400 ring-green-400/20' : 'bg-indigo-400/10 text-indigo-400 ring-indigo-400/30'}">
            {prayer.status.charAt(0).toUpperCase() + prayer.status.slice(1)}
        </span>
		<div class="flex items-center gap-3">
			{#if updates.length > 0}
				<span class="text-xs text-indigo-400">
					{updates.length} {updates.length === 1 ? 'Update' : 'Updates'}
				</span>
			{/if}
			<span class="text-xs text-slate-500">
				{prayer.createdAt?.toDate().toLocaleDateString() || 'Just now'}
			</span>
		</div>
    </div>
</div>
