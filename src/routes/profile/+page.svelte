<script lang="ts">
    import { user, logout } from '$lib/stores/auth';
    import { requestNotificationPermission, disableFCMNotifications, clearAllFCMTokens, notificationPermission, fcmToken } from '$lib/stores/notifications';
    
    let isRequesting = $state(false);
    let isDisabling = $state(false);
    let isClearingAll = $state(false);
    let showAdvancedSettings = $state(false);

    async function handleEnableNotifications() {
        isRequesting = true;
        await requestNotificationPermission();
        isRequesting = false;
    }

    async function handleDisableNotifications() {
        isDisabling = true;
        try {
            await disableFCMNotifications();
        } catch (error) {
            console.error('Failed to disable notifications:', error);
        }
        isDisabling = false;
    }

    async function handleClearAllNotifications() {
        if (confirm('This will remove all push notification tokens from all your devices. Are you sure?')) {
            isClearingAll = true;
            try {
                await clearAllFCMTokens();
            } catch (error) {
                console.error('Failed to clear all notifications:', error);
            }
            isClearingAll = false;
        }
    }

    // Check if FCM notifications are actually enabled (has token + browser permission)
    const isFCMEnabled = $derived($notificationPermission === 'granted' && $fcmToken !== null);
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
                    {#if isFCMEnabled}
                        <button 
                            onclick={handleDisableNotifications}
                            disabled={isDisabling}
                            class="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 transition-colors"
                        >
                            {isDisabling ? 'Disabling...' : 'Disable'}
                        </button>
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

                <!-- Advanced Settings Section -->
                <div class="mt-6 border-t border-white/5 pt-6">
                    <button 
                        onclick={() => showAdvancedSettings = !showAdvancedSettings}
                        class="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <svg 
                            class="w-4 h-4 transition-transform" 
                            class:rotate-180={showAdvancedSettings}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        Advanced Settings
                    </button>
                    
                    {#if showAdvancedSettings}
                        <div class="mt-4 p-4 rounded-lg bg-slate-800/30 border border-white/5">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-white font-medium text-sm">Clear All Devices</p>
                                    <p class="text-xs text-gray-400">Remove push notifications from all browsers and devices</p>
                                </div>
                                {#if $notificationPermission === 'granted' || $fcmToken !== null}
                                    <button 
                                        onclick={handleClearAllNotifications}
                                        disabled={isClearingAll}
                                        class="rounded-md bg-gray-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 disabled:opacity-50 transition-colors"
                                    >
                                        {isClearingAll ? 'Clearing...' : 'Clear All'}
                                    </button>
                                {:else}
                                    <span class="text-xs text-gray-500">No active devices</span>
                                {/if}
                            </div>
                        </div>
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
