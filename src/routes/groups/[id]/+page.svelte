<script lang="ts">
    import { page } from '$app/stores';
    import { db, auth } from '$lib/firebase';
    import { doc, getDoc, onSnapshot, collection, query, where, orderBy, type Timestamp } from 'firebase/firestore';
    import { onMount } from 'svelte';
    import { user } from '$lib/stores/auth';
    import { joinGroup, type Group } from '$lib/stores/groups';
    import type { Prayer } from '$lib/stores/prayers';
    import PrayerCard from '$lib/components/PrayerCard.svelte';
    import AddPrayerModal from '$lib/components/AddPrayerModal.svelte';
    
    let groupId = $derived($page.params.id);
    let group = $state<Group | null>(null);
    let groupPrayers = $state<Prayer[]>([]);
    let loading = $state(true);
    let joining = $state(false);
    let isAddModalOpen = $state(false);

    let isMember = $derived(group && $user && group.members.includes($user.uid));

    async function handleJoin() {
        if (!groupId || !$user) return;
        joining = true;
        try {
            await joinGroup(groupId);
        } catch (err) {
            console.error("Failed to join group", err);
            alert("Failed to join group");
        } finally {
            joining = false;
        }
    }

    async function copyInviteLink() {
        const link = window.location.href;
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
        }, (error) => {
            console.error("Error fetching group details:", error);
            loading = false;
        });

        let prayersUnsub = () => {};

        // Only subscribe to prayers if member (though security rules will block it anyway)
        $effect(() => {
            if (isMember) {
                const q = query(
                    collection(db, 'prayers'), 
                    where('sharedWith', 'array-contains', groupId),
                    orderBy('createdAt', 'desc')
                );

                prayersUnsub = onSnapshot(q, (snapshot) => {
                     groupPrayers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Prayer));
                }, (err) => {
                    console.error("Error fetching group prayers", err);
                });
            } else {
                groupPrayers = [];
                prayersUnsub();
            }
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
            <div class="flex flex-col gap-4">
                <!-- Top row with group name and invite button -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <a href="/groups" class="text-gray-400 hover:text-white transition-colors" aria-label="Back to groups">
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
                            </svg>
                        </a>
                        <h1 class="text-3xl font-bold text-white">{group.name}</h1>
                    </div>
                    
                    {#if $user}
                        <button 
                            onclick={copyInviteLink}
                            class="inline-flex items-center rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/10 transition-colors"
                        >
                            <svg class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clip-rule="evenodd" />
                            </svg>
                            Invite
                        </button>
                    {/if}
                </div>
                
                <!-- Middle row with member info and join button -->
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div class="flex items-center gap-4 text-sm text-gray-500">
                         <span>{group.members.length} member{group.members.length === 1 ? '' : 's'}</span>
                         {#if isMember}
                            <span class="inline-flex items-center rounded-md bg-green-400/10 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">Member</span>
                         {/if}
                    </div>
                    
                    <div class="flex gap-3">
                        {#if !isMember && $user}
                            <button 
                                onclick={handleJoin}
                                disabled={joining}
                                class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
                            >
                                {joining ? 'Joining...' : 'Join Group'}
                            </button>
                        {/if}
                    </div>
                </div>
                
                <!-- Bottom row with description -->
                {#if group.description}
                    <p class="text-gray-400">{group.description}</p>
                {/if}
            </div>
        </header>

        <section>
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-white">Prayer Requests</h2>
                {#if isMember}
                    <button 
                        onclick={() => isAddModalOpen = true}
                        class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors whitespace-nowrap"
                    >
                        + New Prayer
                    </button>
                {/if}
            </div>
            {#if !isMember}
                <div class="text-center py-24 rounded-xl border border-dashed border-white/10 bg-slate-900/20">
                    <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 class="mt-4 text-lg font-medium text-white">Member Access Only</h3>
                    <p class="mt-2 text-gray-400">Join this group to see and share prayer requests.</p>
                    {#if $user}
                        <button 
                            onclick={handleJoin}
                            disabled={joining}
                            class="mt-6 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                        >
                            {joining ? 'Joining...' : 'Join Group'}
                        </button>
                    {:else}
                        <a href="/login" class="mt-6 inline-block text-indigo-400 hover:text-indigo-300">Login to join</a>
                    {/if}
                </div>
            {:else if groupPrayers.length === 0}
                <div class="text-center py-12 rounded-lg border border-dashed border-white/10">
                    <p class="text-gray-500">No prayer requests in this group yet.</p>
                </div>
            {:else}
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {#each groupPrayers as prayer (prayer.id)}
                         <PrayerCard {prayer} showGroupTags={false} />
                    {/each}
                </div>
            {/if}
        </section>
    </div>
{/if}

<AddPrayerModal bind:isOpen={isAddModalOpen} initialGroupIds={[groupId]} />
