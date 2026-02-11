<script lang="ts">
	import { markAnswered, markActive, subscribeToPrayerUpdates, prayerUpdates, prayedFor, type Prayer } from '$lib/stores/prayers';
    import { groups } from '$lib/stores/groups';
    import { user } from '$lib/stores/auth';
	import { onMount, onDestroy } from 'svelte';
    import { profiles, fetchUserProfile } from '$lib/stores/users';
    import SharePrayerModal from './SharePrayerModal.svelte';
    
    let { prayer, showGroupTags = true, showOwnerInfo = true } = $props<{ prayer: Prayer; showGroupTags?: boolean; showOwnerInfo?: boolean }>();
	let unsubscribeUpdates: (() => void) | null = null;
	
	// Use $derived instead of $: for Svelte 5 runes mode
	let updates = $derived($prayerUpdates[prayer.id] || []);
    let isOwner = $derived($user?.uid === prayer.ownerId);
    let sharedGroups = $derived($groups.filter(g => prayer.sharedWith?.includes(g.id)));
    let ownerProfile = $derived($profiles[prayer.ownerId]);
    let hasPrayed = $derived(prayer.prayedBy?.includes($user?.uid || ''));

    let isShareModalOpen = $state(false);
    let isPraying = $state(false);

    async function handleToggleStatus() {
        if (prayer.status === 'answered') {
            await markActive(prayer.id);
        } else {
            await markAnswered(prayer.id);
        }
    }

    async function handlePrayedFor() {
        if (isPraying) return;
        
        isPraying = true;
        try {
            await prayedFor(prayer);
            // Debounce for 1 second to prevent double-taps
            setTimeout(() => {
                isPraying = false;
            }, 1000);
        } catch (error) {
            console.error("Error updating prayer count:", error);
            isPraying = false;
        }
    }
	
	onMount(() => {
		unsubscribeUpdates = subscribeToPrayerUpdates(prayer.id);
        if (showOwnerInfo) {
            fetchUserProfile(prayer.ownerId);
        }
	});
	
	onDestroy(() => {
		if (unsubscribeUpdates) unsubscribeUpdates();
	});
</script>

<div class="relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6 backdrop-blur-sm transition-all hover:bg-slate-900/80 hover:border-indigo-500/30 group">
    <div class="flex justify-between items-start">
		<!-- Clickable prayer content -->
		<a href="/prayers/{prayer.id}" class="flex-1 cursor-pointer">
            <!-- Owner identification -->
            {#if showOwnerInfo}
                <div class="flex items-center space-x-2 mb-3">
                    <img 
                        src={ownerProfile?.photoURL || (ownerProfile?.displayName ? `https://ui-avatars.com/api/?name=${ownerProfile.displayName}` : `https://ui-avatars.com/api/?name=User`)} 
                        alt="Owner Profile" 
                        class="h-6 w-6 rounded-full border border-white/10" 
                    />
                    <span class="text-xs font-medium text-slate-400">
                        {ownerProfile?.displayName || 'Loading...'}
                    </span>
                </div>
            {/if}

			{#if prayer.summary}
				<!-- Summary is always shown -->
				<h4 class="text-xl font-semibold text-white mb-2 hover:text-indigo-300 transition-colors">{prayer.summary}</h4>
				{#if prayer.description}
					<p class="text-slate-300 leading-relaxed whitespace-pre-wrap line-clamp-1">{prayer.description}</p>
				{/if}
			{:else if (prayer as any).content}
				<!-- Old format with just content - fallback for existing prayers -->
				<p class="text-lg text-slate-200 leading-relaxed whitespace-pre-wrap line-clamp-1">{(prayer as any).content}</p>
			{:else}
				<!-- No content at all -->
				<p class="text-slate-500 italic">No content available</p>
			{/if}
		</a>
        
        <div class="flex items-center space-x-2 ml-4">
            {#if isOwner && prayer.status !== 'answered'}
                <button 
                    onclick={(e) => { e.preventDefault(); e.stopPropagation(); isShareModalOpen = true; }}
                    class="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 rounded-full transition-colors"
                    title="Share with group"
                >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </button>
            {/if}
            {#if isOwner}
                <button 
                    onclick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleStatus(); }}
                    class="p-2 {prayer.status === 'answered' ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10' : 'text-rose-400 hover:text-rose-300 hover:bg-rose-400/10'} rounded-full transition-colors"
                    title={prayer.status === 'answered' ? "Mark as Active" : "Mark as Answered"}
                >
                    {#if prayer.status === 'answered'}
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l5 5m-5-5l5-5" />
                        </svg>
                    {:else}
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 14.5c.667 0 1.333-.333 2-1 1.333-1.333 1.333-3.333 0-4.667l-2-2.333-2 2.333c-1.333 1.333-1.333 3.333 0 4.667.667.667 1.333 1 2 1Z" />
                            <path d="M17.5 19c3-2 4.5-4.5 4.5-7.5H2c0 3 1.5 5.5 4.5 7.5.667 0 1.333-.333 2-1a4 4 0 0 0 6 0c.667.667 1.333 1 2 1" />
                        </svg>
                    {/if}
                </button>
            {/if}
        </div>
    </div>

    <!-- Shared with groups (Owner Only) -->
    {#if isOwner && showGroupTags && sharedGroups.length > 0}
        <div class="mt-3 flex flex-wrap gap-2">
            {#each sharedGroups as group}
                <span class="inline-flex items-center rounded-full bg-indigo-400/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 ring-1 ring-inset ring-indigo-400/20">
                    {group.name}
                </span>
            {/each}
        </div>
    {/if}
    
    <div class="mt-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
            <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset {prayer.status === 'answered' ? 'bg-green-400/10 text-green-400 ring-green-400/20' : 'bg-indigo-400/10 text-indigo-400 ring-indigo-400/30'}">
                {prayer.status.charAt(0).toUpperCase() + prayer.status.slice(1)}
            </span>
            
            {#if !isOwner}
                <button 
                    onclick={(e) => { e.preventDefault(); e.stopPropagation(); handlePrayedFor(); }}
                    class="inline-flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all {isPraying ? 'scale-95 bg-indigo-600 text-white' : hasPrayed ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 ring-1 ring-inset ring-indigo-500/40' : 'bg-indigo-400/10 text-indigo-400 hover:bg-indigo-400/20 ring-1 ring-inset ring-indigo-400/30'}"
                    disabled={isPraying}
                    title="I'm praying for this"
                >
                    <span class="text-sm {isPraying ? 'animate-bounce' : ''}">🙏</span>
                    <span>{prayer.prayedCount || 0}</span>
                </button>
            {:else if (prayer.prayedCount || 0) > 0}
                <div class="inline-flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs font-medium bg-indigo-400/5 text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
                    <span class="text-sm">🙏</span>
                    <span>{prayer.prayedCount}</span>
                </div>
            {/if}
        </div>

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

<SharePrayerModal bind:isOpen={isShareModalOpen} prayerId={prayer.id} sharedWith={prayer.sharedWith} />
