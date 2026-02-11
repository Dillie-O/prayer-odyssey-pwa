<script lang="ts">
    import { groups } from '$lib/stores/groups';
    import { updatePrayerSharing } from '$lib/stores/prayers';
    
    let { isOpen = $bindable(), prayerId, sharedWith = [] } = $props<{ 
        isOpen: boolean, 
        prayerId: string,
        sharedWith?: string[]
    }>();
    
    let selectedGroupIds = $state<string[]>([]);
    let loading = $state(false);
    let error = $state('');

    // Initialize selected groups when modal opens or sharedWith changes
    $effect(() => {
        if (isOpen) {
            selectedGroupIds = [...sharedWith];
        }
    });

    async function handleShare() {
        loading = true;
        error = '';
        try {
            await updatePrayerSharing(prayerId, selectedGroupIds);
            isOpen = false;
        } catch (err: any) {
            error = err.message || 'Failed to update sharing';
        } finally {
            loading = false;
        }
    }

    function toggleGroup(groupId: string) {
        if (selectedGroupIds.includes(groupId)) {
            selectedGroupIds = selectedGroupIds.filter(id => id !== groupId);
        } else {
            selectedGroupIds = [...selectedGroupIds, groupId];
        }
    }

    function closeModal() {
        isOpen = false;
        error = '';
    }
</script>

{#if isOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <button 
            type="button"
            class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onclick={closeModal}
            aria-label="Close modal"
        ></button>
        
        <!-- Modal Content -->
        <div class="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-white">Share Prayer</h2>
                <button 
                    onclick={closeModal}
                    class="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {#if $groups.length === 0}
                <div class="text-center py-8">
                    <p class="text-gray-400 mb-4">You are not a member of any groups yet.</p>
                    <a href="/groups" class="text-indigo-400 hover:text-indigo-300 font-medium">Create or join a group</a>
                </div>
            {:else}
                <div class="space-y-4">
                    <p class="text-sm text-gray-400">Select the groups you want to share this prayer with:</p>
                    
                    <div class="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {#each $groups as group}
                            <label 
                                class="flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer {selectedGroupIds.includes(group.id) ? 'bg-indigo-500/10 border-indigo-500/50 text-white' : 'bg-slate-800/50 border-white/5 text-gray-400 hover:bg-white/5'}"
                            >
                                <span class="font-medium text-sm">{group.name}</span>
                                <input 
                                    type="checkbox" 
                                    checked={selectedGroupIds.includes(group.id)}
                                    onchange={() => toggleGroup(group.id)}
                                    class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 bg-slate-950"
                                />
                            </label>
                        {/each}
                    </div>

                    {#if error}
                        <p class="text-sm text-rose-400">{error}</p>
                    {/if}

                    <div class="flex justify-end gap-3 mt-8">
                        <button 
                            type="button"
                            onclick={closeModal}
                            class="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button"
                            onclick={handleShare}
                            disabled={loading}
                            class="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
</style>
