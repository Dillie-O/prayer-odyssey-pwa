<script lang="ts">
	import { user, logout } from '$lib/stores/auth';
    import { page } from '$app/stores';
    import { unreadCount, subscribeToNotifications } from '$lib/stores/notifications';
    import NotificationDropdown from './NotificationDropdown.svelte';
    import { onMount, onDestroy } from 'svelte';
	
	let isOpen = $state(false);
    let isNotificationsOpen = $state(false);
    let path = $derived($page.url.pathname);
    let unsubscribe: (() => void) | null = null;

    function isActive(href: string) {
        if (href === '/') return path === '/';
        return path.startsWith(href);
    }

    // Subscribe to notifications when user changes
    $effect(() => {
        if ($user) {
            unsubscribe = subscribeToNotifications($user.uid);
        } else if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
    });

    onMount(() => {
        // Handle clicks outside to close dropdowns if needed, 
        // but for now let's keep it simple.
    });

    onDestroy(() => {
        if (unsubscribe) unsubscribe();
    });
</script>

<nav class="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<div class="flex items-center space-x-8">
			<a href="/" class="flex items-center space-x-3">
				<img src="/prayer_icon_logo_192.png" alt="Logo" class="h-8 w-8 rounded-lg" />
				<span class="text-lg font-bold text-white">Prayer Odyssey</span>
			</a>

            <!-- Desktop Links -->
            <div class="hidden sm:flex items-center space-x-4">
                <a href="/" class="px-3 py-2 text-sm font-medium transition-colors {isActive('/') ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}">Home</a>
                <a href="/prayers" class="px-3 py-2 text-sm font-medium transition-colors {isActive('/prayers') ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}">Prayers</a>
                <a href="/groups" class="px-3 py-2 text-sm font-medium transition-colors {isActive('/groups') ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}">Groups</a>
            </div>
		</div>

		<div class="flex items-center space-x-2 sm:space-x-4">
			{#if $user}
                <!-- Notifications Bell -->
                <div class="relative">
                    <button 
                        class="p-2 text-slate-400 hover:text-white transition-colors relative"
                        onclick={() => isNotificationsOpen = !isNotificationsOpen}
                    >
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {#if $unreadCount > 0}
                            <span class="absolute top-1.5 right-1.5 flex h-4 w-4">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 text-[10px] font-bold text-white items-center justify-center">
                                    {$unreadCount > 9 ? '9+' : $unreadCount}
                                </span>
                            </span>
                        {/if}
                    </button>

                    <NotificationDropdown bind:isOpen={isNotificationsOpen} />
                </div>

				<div class="relative">
					<button 
						class="flex items-center space-x-2 rounded-full bg-slate-800 p-1 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						onclick={() => isOpen = !isOpen}
					>
						<img 
							src={$user.photoURL || `https://ui-avatars.com/api/?name=${$user.displayName}`} 
							alt="Profile" 
							class="h-8 w-8 rounded-full" 
						/>
						<span class="text-sm font-medium text-white hidden sm:block">{$user.displayName}</span>
					</button>

					{#if isOpen}
						<div class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-slate-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-white/10">
							<a href="/profile" class="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-800">Your Profile</a>
							<button 
								onclick={logout}
								class="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-slate-800"
							>
								Sign out
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<a href="/login" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
					Sign In
				</a>
			{/if}
		</div>
	</div>
</nav>
<div class="h-16"></div> <!-- Spacer -->
