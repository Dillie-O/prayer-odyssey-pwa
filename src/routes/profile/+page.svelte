<script lang="ts">
    import { user, logout } from '$lib/stores/auth';
    import { requestNotificationPermission, notificationPermission } from '$lib/stores/notifications';
    
    let isRequesting = $state(false);

    async function handleEnableNotifications() {
        isRequesting = true;
        await requestNotificationPermission();
        isRequesting = false;
    }
</script>

<div class="space-y-6 max-w-2xl mx-auto">
    <header>
        <h1 class="text-3xl font-bold text-white">Profile</h1>
        <p class="mt-2 text-gray-400">Manage your account and settings</p>
    </header>

    {#if $user}
        <div class="rounded-xl bg-slate-900/50 border border-white/10 p-6 backdrop-blur-sm">
            <div class="flex items-center space-x-4">
                <img 
                    src={$user.photoURL || `https://ui-avatars.com/api/?name=${$user.displayName}`} 
                    alt="Profile" 
                    class="h-16 w-16 rounded-full border-2 border-indigo-500/50" 
                />
                <div>
                    <h2 class="text-xl font-semibold text-white">{$user.displayName}</h2>
                    <p class="text-gray-400">{$user.email}</p>
                </div>
            </div>
            
            <div class="mt-8 border-t border-white/10 pt-6">
                <h3 class="text-lg font-medium text-white mb-4">Notifications</h3>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-white font-medium">Push Notifications</p>
                        <p class="text-sm text-gray-400">Receive updates when someone prays for you</p>
                    </div>
                    {#if $notificationPermission === 'granted'}
                        <span class="inline-flex items-center rounded-md bg-green-400/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">
                            Enabled
                        </span>
                    {:else if $notificationPermission === 'denied'}
                        <span class="inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
                            Denied
                        </span>
                    {:else}
                         <button 
                            onclick={handleEnableNotifications}
                            disabled={isRequesting}
                            class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors"
                        >
                            {isRequesting ? 'Enabling...' : 'Enable Notifications'}
                        </button>
                    {/if}
                </div>
            </div>

            <div class="mt-8 border-t border-white/10 pt-6">
                <button 
                    onclick={logout}
                    class="w-full rounded-md bg-white/5 px-3 py-2 text-sm font-semibold text-red-400 shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/10 hover:text-red-300 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    {/if}
</div>
