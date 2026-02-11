<script lang="ts">
    import { notifications, markAsRead, deleteNotification, clearAllNotifications, type AppNotification } from '$lib/stores/notifications';
    import { fly, fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let { isOpen = $bindable(false) } = $props<{ isOpen: boolean }>();
    let isClearing = false;

    function formatTime(timestamp: any) {
        if (!timestamp) return 'Just now';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    async function handleMarkRead(id: string) {
        await markAsRead(id);
    }

    async function handleDelete(e: Event, id: string) {
        e.stopPropagation();
        await deleteNotification(id);
    }

    async function handleNavigateToPrayer(notification: AppNotification) {
        // Only navigate if notification has a prayerId
        if (!notification.prayerId) return;
        
        // Mark as read before navigating
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        
        // Navigate to prayer page
        goto(`/prayers/${notification.prayerId}`);
        
        // Close dropdown
        isOpen = false;
    }

    async function handleClearAll() {
        if (isClearing) return;
        
        isClearing = true;
        try {
            await clearAllNotifications();
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        } finally {
            isClearing = false;
        }
    }
</script>

{#if isOpen}
    <div 
        class="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl bg-slate-900 shadow-2xl ring-1 ring-black/5 border border-white/10 overflow-hidden z-[60]"
        in:fly={{ y: -10, duration: 200 }}
        out:fade={{ duration: 150 }}
    >
        <div class="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
            <h3 class="text-sm font-semibold text-white">Notifications</h3>
            {#if $notifications.length > 0}
                <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{$notifications.length} Total</span>
            {/if}
        </div>

        <div class="max-h-[400px] overflow-y-auto custom-scrollbar">
            {#if $notifications.length === 0}
                <div class="px-4 py-8 text-center">
                    <div class="text-slate-500 mb-2">
                        <svg class="w-10 h-10 mx-auto opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <p class="text-sm text-slate-400">All caught up!</p>
                </div>
            {:else}
                <div class="divide-y divide-white/5">
                    {#each $notifications as notification (notification.id)}
                        <div 
                            class="w-full text-left px-4 py-3 hover:bg-slate-800/50 transition-colors relative group cursor-pointer {notification.read ? 'opacity-60' : ''}"
                            onclick={() => handleNavigateToPrayer(notification)}
                            onkeydown={(e) => e.key === 'Enter' && handleNavigateToPrayer(notification)}
                            role="button"
                            tabindex="0"
                        >
                            <div class="flex gap-3">
                                <div class="flex-shrink-0 mt-1">
                                    {#if notification.type === 'prayer_reaction'}
                                        <div class="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-sm">🙏</div>
                                    {:else if notification.type === 'prayer_update'}
                                        <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-lg">📝</div>
                                    {:else if notification.type === 'prayer_answered'}
                                        <div class="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-lg">✨</div>
                                    {:else if notification.type === 'prayer_shared'}
                                        <div class="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-lg">📤</div>
                                    {:else}
                                        <div class="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center text-lg">🔔</div>
                                    {/if}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm text-slate-200 leading-snug">
                                        <span class="font-semibold text-white">{notification.senderName}</span>
                                        {#if notification.type === 'prayer_reaction'}
                                            is praying for <span class="text-indigo-300 font-medium">"{notification.prayerSummary}"</span>
                                        {:else if notification.type === 'prayer_update'}
                                            added an update to <span class="text-emerald-300 font-medium">"{notification.prayerSummary}"</span>
                                            {#if notification.groupName}
                                                in <span class="text-purple-300 font-medium">{notification.groupName}</span>
                                            {/if}
                                        {:else if notification.type === 'prayer_shared'}
                                            shared <span class="text-blue-300 font-medium">"{notification.prayerSummary}"</span> with your group
                                            {#if notification.groupName}
                                                in <span class="text-purple-300 font-medium">{notification.groupName}</span>
                                            {/if}
                                        {:else if notification.type === 'prayer_answered'}
                                            marked <span class="text-amber-300 font-medium">"{notification.prayerSummary}"</span> as answered
                                            {#if notification.groupName}
                                                in <span class="text-purple-300 font-medium">{notification.groupName}</span>
                                            {/if}
                                        {:else}
                                            sent you a notification
                                        {/if}
                                    </p>
                                    <p class="text-[10px] text-slate-500 mt-1 font-medium">{formatTime(notification.createdAt)}</p>
                                </div>
                                <div class="flex-shrink-0 flex flex-col items-end gap-2">
                                    {#if !notification.read}
                                        <div class="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                                    {/if}
                                    <button 
                                        class="p-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                        onclick={(e) => handleDelete(e, notification.id)}
                                        title="Delete"
                                        aria-label="Delete notification"
                                    >
                                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
        
        <div class="border-t border-white/5 bg-slate-800/20">
            {#if $notifications.length > 0}
                <button 
                    class="w-full py-2 text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:bg-slate-800/40 transition-all uppercase tracking-widest disabled:opacity-50"
                    onclick={handleClearAll}
                    disabled={isClearing}
                >
                    {isClearing ? 'Clearing...' : 'Clear All'}
                </button>
            {/if}
            <button 
                class="w-full py-3 text-[11px] font-bold text-slate-500 hover:text-indigo-400 hover:bg-slate-800/40 transition-all uppercase tracking-widest"
                onclick={() => isOpen = false}
            >
                Close
            </button>
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
        background: hsla(0, 0%, 100%, 0.1);
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: hsla(0, 0%, 100%, 0.2);
    }
</style>
