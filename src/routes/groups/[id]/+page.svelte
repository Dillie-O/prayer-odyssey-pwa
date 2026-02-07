<script lang="ts">
    import { page } from '$app/stores';
    import { db, auth } from '$lib/firebase';
    import { doc, getDoc, onSnapshot, collection, query, where, orderBy, type Timestamp } from 'firebase/firestore';
    import { onMount } from 'svelte';
    import { user } from '$lib/stores/auth';
    import type { Group } from '$lib/stores/groups';
    import type { Prayer } from '$lib/stores/prayers';
    import PrayerCard from '$lib/components/PrayerCard.svelte';
    
    let groupId = $derived($page.params.id);
    let group = $state<Group | null>(null);
    let groupPrayers = $state<Prayer[]>([]);
    let loading = $state(true);

    async function copyInviteLink() {
        /* Simple invite by ID for now */
        const link = `${window.location.origin}/groups/${groupId}`; // In reality, maybe a join link
        await navigator.clipboard.writeText(link);
        alert('Group link copied to clipboard!');
    }

    onMount(() => {
        if (!groupId) return;

        // Fetch Group Details
        const groupUnsub = onSnapshot(doc(db, 'groups', groupId), (doc) => {
            if (doc.exists()) {
                group = { id: doc.id, ...doc.data() } as Group;
            } else {
                group = null; // Handle 404
            }
            loading = false;
        });

        // Fetch Prayers for this group (this relies on 'sharedWith' array on prayers)
        /* 
           Note: We need to implement sharing prayers with groups first.
           But we can query for it now.
        */
        const q = query(
            collection(db, 'prayers'), 
            where('sharedWith', 'array-contains', groupId),
            orderBy('createdAt', 'desc')
        );

        const prayersUnsub = onSnapshot(q, (snapshot) => {
             groupPrayers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Prayer));
        });

        return () => {
            groupUnsub();
            prayersUnsub();
        };
    });
</script>

{#if loading}
    <div class="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
    </div>
{:else if !group}
    <div class="text-center py-24">
        <h2 class="text-2xl font-bold text-white">Group not found</h2>
        <a href="/groups" class="mt-4 inline-block text-indigo-400 hover:text-indigo-300">Back to Groups</a>
    </div>
{:else}
    <div class="space-y-6">
        <header class="rounded-xl bg-slate-900/50 border border-white/10 p-6 backdrop-blur-sm">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                     <div class="flex items-center gap-3">
                        <a href="/groups" class="text-gray-400 hover:text-white transition-colors" aria-label="Back to groups">
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
                            </svg>
                        </a>
                        <h1 class="text-3xl font-bold text-white">{group.name}</h1>
                     </div>
                    {#if group.description}
                        <p class="mt-2 text-gray-400">{group.description}</p>
                    {/if}
                    <div class="mt-4 flex items-center gap-4 text-sm text-gray-500">
                         <span>{group.members.length} Members</span>
                    </div>
                </div>
                
                <div class="flex gap-3">
                    <button 
                        onclick={copyInviteLink}
                        class="inline-flex items-center rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/10 transition-colors"
                    >
                        <svg class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clip-rule="evenodd" />
                        </svg>
                        Invite
                    </button>
                    <!-- Add Prayer to Group Button could go here or in the general add modal -->
                </div>
            </div>
        </header>

        <section>
            <h2 class="text-xl font-semibold text-white mb-4">Prayer Requests</h2>
            {#if groupPrayers.length === 0}
                <div class="text-center py-12 rounded-lg border border-dashed border-white/10">
                    <p class="text-gray-500">No prayer requests in this group yet.</p>
                </div>
            {:else}
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {#each groupPrayers as prayer (prayer.id)}
                         <PrayerCard {prayer} />
                    {/each}
                </div>
            {/if}
        </section>
    </div>
{/if}
