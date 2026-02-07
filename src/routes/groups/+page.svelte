<script lang="ts">
	import { groups, loadingGroups } from '$lib/stores/groups';
	import CreateGroupModal from '$lib/components/CreateGroupModal.svelte';
	
	let isModalOpen = $state(false);
</script>

<CreateGroupModal bind:isOpen={isModalOpen} />

<div class="space-y-6">
    <header class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-white">Prayer Groups</h1>
        <button 
            onclick={() => isModalOpen = true}
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
        >
            + Create Group
        </button>
    </header>

    {#if $loadingGroups}
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each Array(3) as _}
                <div class="h-32 animate-pulse rounded-xl bg-slate-800/50 border border-white/5"></div>
            {/each}
        </div>
    {:else if $groups.length === 0}
        <div class="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div class="text-center py-12">
                 <button 
                    onclick={() => isModalOpen = true}
                    class="mx-auto block"
                    aria-label="Create new group"
                >
                    <svg class="mx-auto h-12 w-12 text-gray-400 hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </button>
                <h3 class="mt-2 text-sm font-semibold text-white">No groups yet</h3>
                <p class="mt-1 text-sm text-gray-400">Create a group to share prayers with friends and family.</p>
                <div class="mt-6">
                    <button 
                        onclick={() => isModalOpen = true}
                        class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                    >
                         <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                             <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                         </svg>
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    {:else}
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each $groups as group (group.id)}
                <a href="/groups/{group.id}" class="block relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6 backdrop-blur-sm transition-all hover:bg-slate-900/80 hover:border-indigo-500/30 group">
                    <h3 class="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">{group.name}</h3>
                    {#if group.description}
                        <p class="mt-2 text-sm text-gray-400 line-clamp-2">{group.description}</p>
                    {/if}
                    <div class="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <span>{group.members.length} member{group.members.length === 1 ? '' : 's'}</span>
                        <span>{group.createdAt?.toDate().toLocaleDateString() || 'Just now'}</span>
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</div>
