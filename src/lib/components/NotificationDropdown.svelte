<script lang="ts">
	import {
		notifications,
		markAsRead,
		deleteNotification,
		clearAllNotifications,
		type AppNotification
	} from '$lib/stores/notifications';
	import { fly, fade } from 'svelte/transition';
	import { goto } from '$app/navigation';

	let { isOpen = $bindable(false) } = $props<{ isOpen: boolean }>();
	let isClearing = $state(false);

	function formatTime(timestamp: any) {
		if (!timestamp) return 'Just now';
		const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		return (
			date.toLocaleDateString() +
			' ' +
			date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		);
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
		class="absolute right-0 z-[60] mt-2 w-80 origin-top-right overflow-hidden rounded-xl border border-slate-900/10 bg-white shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-900 sm:w-96"
		in:fly={{ y: -10, duration: 200 }}
		out:fade={{ duration: 150 }}
	>
		<div
			class="flex items-center justify-between border-b border-slate-900/10 bg-slate-100/80 px-4 py-3 dark:border-white/5 dark:bg-slate-800/50"
		>
			<h3 class="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
			{#if $notifications.length > 0}
				<span
					class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400"
					>{$notifications.length} Total</span
				>
			{/if}
		</div>

		<div class="custom-scrollbar max-h-[400px] overflow-y-auto">
			{#if $notifications.length === 0}
				<div class="px-4 py-8 text-center">
					<div class="mb-2 text-slate-500">
						<svg
							class="mx-auto h-10 w-10 opacity-20"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
							/>
						</svg>
					</div>
					<p class="text-sm text-slate-400">All caught up!</p>
				</div>
			{:else}
				<div class="divide-y divide-white/5">
					{#each $notifications as notification (notification.id)}
						<div
							class="group relative w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/50 {notification.read
								? 'opacity-60'
								: ''}"
							onclick={() => handleNavigateToPrayer(notification)}
							onkeydown={(e) => e.key === 'Enter' && handleNavigateToPrayer(notification)}
							role="button"
							tabindex="0"
						>
							<div class="flex gap-3">
								<div class="mt-1 flex-shrink-0">
									{#if notification.type === 'prayer_reaction'}
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-sm"
										>
											🙏
										</div>
									{:else if notification.type === 'prayer_update'}
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-lg"
										>
											📝
										</div>
									{:else if notification.type === 'prayer_answered'}
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-lg"
										>
											✨
										</div>
									{:else if notification.type === 'prayer_shared'}
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-lg"
										>
											📤
										</div>
									{:else}
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-500/10 text-lg"
										>
											🔔
										</div>
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm leading-snug text-slate-700 dark:text-slate-200">
										<span class="font-semibold text-slate-900 dark:text-white"
											>{notification.senderName}</span
										>
										{#if notification.type === 'prayer_reaction'}
											is praying for <span class="font-medium text-indigo-300"
												>"{notification.prayerSummary}"</span
											>
										{:else if notification.type === 'prayer_update'}
											added an update to <span class="font-medium text-emerald-300"
												>"{notification.prayerSummary}"</span
											>
											{#if notification.groupName}
												in <span class="font-medium text-purple-300">{notification.groupName}</span>
											{/if}
										{:else if notification.type === 'prayer_shared'}
											shared <span class="font-medium text-blue-300"
												>"{notification.prayerSummary}"</span
											>
											with your group
											{#if notification.groupName}
												in <span class="font-medium text-purple-300">{notification.groupName}</span>
											{/if}
										{:else if notification.type === 'prayer_answered'}
											marked <span class="font-medium text-amber-300"
												>"{notification.prayerSummary}"</span
											>
											as answered
											{#if notification.groupName}
												in <span class="font-medium text-purple-300">{notification.groupName}</span>
											{/if}
										{:else}
											sent you a notification
										{/if}
									</p>
									<p class="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
										{formatTime(notification.createdAt)}
									</p>
								</div>
								<div class="flex flex-shrink-0 flex-col items-end gap-2">
									{#if !notification.read}
										<div
											class="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"
										></div>
									{/if}
									<button
										class="p-1 text-slate-600 opacity-0 transition-all hover:text-rose-400 group-hover:opacity-100"
										onclick={(e) => handleDelete(e, notification.id)}
										title="Delete"
										aria-label="Delete notification"
									>
										<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div
			class="border-t border-slate-900/10 bg-slate-50/80 dark:border-white/5 dark:bg-slate-800/20"
		>
			{#if $notifications.length > 0}
				<button
					class="w-full py-2 text-[11px] font-bold uppercase tracking-widest text-rose-400 transition-all hover:bg-slate-800/40 hover:text-rose-300 disabled:opacity-50"
					onclick={handleClearAll}
					disabled={isClearing}
				>
					{isClearing ? 'Clearing...' : 'Clear All'}
				</button>
			{/if}
			<button
				class="w-full py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 transition-all hover:bg-slate-100 hover:text-indigo-500 dark:text-slate-500 dark:hover:bg-slate-800/40 dark:hover:text-indigo-400"
				onclick={() => (isOpen = false)}
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
