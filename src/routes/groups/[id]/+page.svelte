<script lang="ts">
	import { page } from '$app/stores';
	import { db } from '$lib/firebase';
	import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import { user } from '$lib/stores/auth';
	import { joinGroup, type Group } from '$lib/stores/groups';
	import type { Prayer } from '$lib/stores/prayers';
	import { viewMode } from '$lib/stores/viewMode';
	import PrayerCard from '$lib/components/PrayerCard.svelte';
	import PrayerCarousel from '$lib/components/PrayerCarousel.svelte';
	import AddPrayerModal from '$lib/components/AddPrayerModal.svelte';

	let groupId = $derived($page.params.id);
	let group = $state<Group | null>(null);
	let groupPrayers = $state<Prayer[]>([]);
	let loading = $state(true);
	let joining = $state(false);
	let isAddModalOpen = $state(false);
	let isQrModalOpen = $state(false);
	let isInviteMenuOpen = $state(false);
	let qrCodeDataUrl = $state('');
	let qrCodeLoading = $state(false);
	let qrCodeError = $state('');
	let qrModalRef = $state<HTMLDivElement | null>(null);
	let inviteMenuRef = $state<HTMLDivElement | null>(null);
	let filter = $state<'all' | 'active' | 'answered'>('active');
	const QR_CODE_SIZE = 256;
	const QR_CODE_MARGIN = 1;

	let isMember = $derived(group && $user && group.members.includes($user.uid));
	let filteredPrayers = $derived(
		groupPrayers.filter((p) => {
			if (filter === 'all') return true;
			return p.status === filter;
		})
	);

	async function handleJoin() {
		if (!groupId || !$user) return;
		joining = true;
		try {
			await joinGroup(groupId);
		} catch (err) {
			console.error('Failed to join group', err);
			alert('Failed to join group');
		} finally {
			joining = false;
		}
	}

	function getInviteLink() {
		return window.location.href;
	}

	async function copyInviteLink() {
		const link = getInviteLink();
		await navigator.clipboard.writeText(link);
		alert('Group link copied to clipboard!');
	}

	function toggleInviteMenu() {
		isInviteMenuOpen = !isInviteMenuOpen;
	}

	function closeInviteMenu() {
		isInviteMenuOpen = false;
	}

	async function handleCopyInviteLink() {
		await copyInviteLink();
		closeInviteMenu();
	}

	async function handleOpenQrModalFromMenu() {
		closeInviteMenu();
		await openQrModal();
	}

	async function openQrModal() {
		isQrModalOpen = true;
		qrCodeLoading = true;
		qrCodeError = '';
		qrCodeDataUrl = '';

		try {
			const inviteLink = getInviteLink();
			qrCodeDataUrl = await QRCode.toDataURL(inviteLink, {
				width: QR_CODE_SIZE,
				margin: QR_CODE_MARGIN
			});
		} catch (err) {
			console.error('Failed to generate invite QR code', err);
			qrCodeError = 'Failed to generate QR code. Please try again.';
		} finally {
			qrCodeLoading = false;
		}
	}

	function closeQrModal() {
		isQrModalOpen = false;
	}

	$effect(() => {
		if (!isQrModalOpen || !qrModalRef) return;

		const previouslyFocused = document.activeElement as HTMLElement | null;
		const focusableSelectors = [
			'button:not([disabled])',
			'[href]',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])'
		].join(',');
		const getFocusableElements = () =>
			Array.from(qrModalRef?.querySelectorAll<HTMLElement>(focusableSelectors) ?? []);

		const focusableElements = getFocusableElements();
		focusableElements[0]?.focus();

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				closeQrModal();
				return;
			}

			if (event.key !== 'Tab') return;

			const currentFocusableElements = getFocusableElements();
			if (currentFocusableElements.length === 0) {
				event.preventDefault();
				return;
			}

			const first = currentFocusableElements[0];
			const last = currentFocusableElements[currentFocusableElements.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};

		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			previouslyFocused?.focus();
		};
	});

	$effect(() => {
		if (!isInviteMenuOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			if (!inviteMenuRef) return;
			if (!inviteMenuRef.contains(event.target as Node)) {
				closeInviteMenu();
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				closeInviteMenu();
			}
		};

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	});

	onMount(() => {
		if (!groupId) return;

		// Fetch Group Details
		const groupUnsub = onSnapshot(
			doc(db, 'groups', groupId),
			(doc) => {
				if (doc.exists()) {
					group = { id: doc.id, ...doc.data() } as Group;
				} else {
					group = null; // Handle 404
				}
				loading = false;
			},
			(error) => {
				console.error('Error fetching group details:', error);
				loading = false;
			}
		);

		let prayersUnsub = () => {};

		// Only subscribe to prayers if member (though security rules will block it anyway)
		$effect(() => {
			if (isMember) {
				const q = query(
					collection(db, 'prayers'),
					where('sharedWith', 'array-contains', groupId),
					orderBy('createdAt', 'desc')
				);

				prayersUnsub = onSnapshot(
					q,
					(snapshot) => {
						groupPrayers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Prayer);
					},
					(err) => {
						console.error('Error fetching group prayers', err);
					}
				);
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
		<div
			class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
		></div>
	</div>
{:else if !group}
	<div class="py-24 text-center">
		<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Group not found</h2>
		<a
			href="/groups"
			class="mt-4 inline-block text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
			>Back to Groups</a
		>
	</div>
{:else}
	<div class="space-y-6">
		<header
			class="rounded-xl border border-slate-900/10 bg-white/80 p-6 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/50"
		>
			<div class="flex flex-col gap-4">
				<!-- Top row with group name -->
				<div class="flex items-center">
					<div class="flex min-w-0 items-center gap-3">
						<a
							href="/groups"
							class="text-gray-500 transition-colors hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
							aria-label="Back to groups"
						>
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
									clip-rule="evenodd"
								/>
							</svg>
						</a>
						<h1 class="text-3xl font-bold text-slate-900 dark:text-white">{group.name}</h1>
					</div>
				</div>

				<!-- Middle row with member info and actions -->
				<div class="flex items-center justify-between gap-3">
					<div class="flex min-w-0 flex-wrap items-center gap-4 text-sm text-gray-500">
						<span>{group.members.length} member{group.members.length === 1 ? '' : 's'}</span>
						{#if isMember}
							<span
								class="inline-flex items-center rounded-md bg-green-400/10 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20"
								>Member</span
							>
						{/if}
					</div>

					<div class="flex shrink-0 gap-3">
						{#if $user}
							<div class="relative" bind:this={inviteMenuRef}>
								<button
									onclick={toggleInviteMenu}
									class="inline-flex items-center whitespace-nowrap rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-900/10 transition-colors hover:bg-slate-200 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10 sm:px-4 sm:py-2 sm:text-sm"
									aria-haspopup="menu"
									aria-expanded={isInviteMenuOpen}
								>
									<svg
										class="-ml-0.5 mr-1.5 h-5 w-5 text-gray-500 dark:text-gray-400"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z"
											clip-rule="evenodd"
										/>
									</svg>
									Invite
									<svg
										class="ml-2 h-4 w-4 text-gray-500 dark:text-gray-400"
										viewBox="0 0 20 20"
										fill="currentColor"
										aria-hidden="true"
									>
										<path
											fill-rule="evenodd"
											d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.939a.75.75 0 111.08 1.04l-4.25 4.511a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
											clip-rule="evenodd"
										/>
									</svg>
								</button>
								{#if isInviteMenuOpen}
									<div
										class="absolute right-0 z-10 mt-2 w-40 rounded-lg border border-slate-900/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-slate-900"
										role="menu"
										aria-label="Invite options"
									>
										<button
											onclick={handleCopyInviteLink}
											class="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
											role="menuitem"
										>
											Copy link
										</button>
										<button
											onclick={handleOpenQrModalFromMenu}
											class="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
											role="menuitem"
										>
											QR code
										</button>
									</div>
								{/if}
							</div>
						{/if}
						{#if !isMember && $user}
							<button
								onclick={handleJoin}
								disabled={joining}
								class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
							>
								{joining ? 'Joining...' : 'Join Group'}
							</button>
						{/if}
					</div>
				</div>

				<!-- Bottom row with description -->
				{#if group.description}
					<p class="text-gray-500 dark:text-gray-400">{group.description}</p>
				{/if}
			</div>
		</header>

		<section>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-slate-900 dark:text-white">Prayer Requests</h2>
				{#if isMember}
					<button
						onclick={() => (isAddModalOpen = true)}
						class="inline-flex items-center whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
					>
						+ New Prayer
					</button>
				{/if}
			</div>

			{#if isMember}
				<!-- Filter Tabs with View Toggle -->
				<div class="mb-6 flex items-center justify-between">
					<!-- Filter Buttons -->
					<div
						class="flex items-center space-x-1 rounded-xl border border-slate-900/10 bg-slate-200/80 p-1 backdrop-blur-sm dark:border-white/5 dark:bg-slate-900/50"
					>
						<button
							onclick={() => (filter = 'active')}
							class="rounded-lg px-4 py-2 text-sm font-medium transition-all {filter === 'active'
								? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
								: 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'}"
						>
							Active
						</button>
						<button
							onclick={() => (filter = 'answered')}
							class="rounded-lg px-4 py-2 text-sm font-medium transition-all {filter === 'answered'
								? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
								: 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'}"
						>
							Answered
						</button>
						<button
							onclick={() => (filter = 'all')}
							class="rounded-lg px-4 py-2 text-sm font-medium transition-all {filter === 'all'
								? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
								: 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'}"
						>
							All
						</button>
					</div>

					<!-- View Toggle Buttons -->
					<div
						class="flex items-center space-x-1 rounded-xl border border-slate-900/10 bg-slate-200/80 p-1 backdrop-blur-sm dark:border-white/5 dark:bg-slate-900/50"
					>
						<button
							onclick={() => viewMode.set('list')}
							class="rounded-lg px-3 py-2 text-sm font-medium transition-all {$viewMode === 'list'
								? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
								: 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'}"
							title="List view"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						</button>
						<button
							onclick={() => viewMode.set('carousel')}
							class="rounded-lg px-3 py-2 text-sm font-medium transition-all {$viewMode ===
							'carousel'
								? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
								: 'text-slate-600 hover:bg-white/10 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'}"
							title="Carousel view"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/if}

			{#if !isMember}
				<div
					class="rounded-xl border border-dashed border-slate-900/10 bg-slate-100/20 py-24 text-center dark:border-white/10 dark:bg-slate-900/20"
				>
					<svg
						class="mx-auto h-12 w-12 text-gray-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
					<h3 class="mt-4 text-lg font-medium text-white">Member Access Only</h3>
					<p class="mt-2 text-gray-500 dark:text-gray-400">
						Join this group to see and share prayer requests.
					</p>
					{#if $user}
						<button
							onclick={handleJoin}
							disabled={joining}
							class="mt-6 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
						>
							{joining ? 'Joining...' : 'Join Group'}
						</button>
					{:else}
						<a href="/login" class="mt-6 inline-block text-indigo-400 hover:text-indigo-300"
							>Login to join</a
						>
					{/if}
				</div>
			{:else if groupPrayers.length === 0}
				<div class="rounded-lg border border-dashed border-white/10 py-12 text-center">
					<p class="text-gray-500">No prayer requests in this group yet.</p>
				</div>
			{:else if filteredPrayers.length === 0}
				<div class="rounded-lg border border-dashed border-white/10 py-12 text-center">
					<p class="text-gray-500">No {filter === 'all' ? '' : filter} prayers found.</p>
				</div>
			{:else}
				<!-- Conditional rendering based on view mode -->
				{#if $viewMode === 'carousel'}
					<div class="mx-auto max-w-2xl">
						<PrayerCarousel prayers={filteredPrayers} />
					</div>
				{:else}
					<!-- List View (existing grid layout) -->
					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each filteredPrayers as prayer (prayer.id)}
							<PrayerCard {prayer} showGroupTags={false} />
						{/each}
					</div>
				{/if}
			{/if}
		</section>
	</div>
{/if}

{#if isQrModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
		<button
			type="button"
			class="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
			aria-label="Close QR code modal"
			onclick={closeQrModal}
		></button>
		<div
			class="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900"
			role="dialog"
			aria-modal="true"
			aria-labelledby="invite-qr-modal-title"
			bind:this={qrModalRef}
		>
			<div class="flex items-center justify-between">
				<h2 id="invite-qr-modal-title" class="text-lg font-semibold text-slate-900 dark:text-white">
					Invite QR Code
				</h2>
				<button
					onclick={closeQrModal}
					class="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
					aria-label="Close QR code modal"
				>
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
			<div class="mt-4 flex justify-center rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
				{#if qrCodeLoading}
					<div
						class="flex h-64 w-64 items-center justify-center"
						role="status"
						aria-label="Generating QR code"
					>
						<div
							class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
						></div>
					</div>
				{:else if qrCodeError}
					<p class="text-sm text-red-500 dark:text-red-400" role="alert" aria-live="assertive">
						{qrCodeError}
					</p>
				{:else}
					<img src={qrCodeDataUrl} alt="QR code for group invite link" class="h-64 w-64" />
				{/if}
			</div>
			<p class="mt-4 break-words text-center text-xs text-slate-500 dark:text-slate-400">
				<span class="sr-only">Invite link URL:</span>
				{getInviteLink()}
			</p>
		</div>
	</div>
{/if}

<AddPrayerModal bind:isOpen={isAddModalOpen} initialGroupIds={groupId ? [groupId] : []} />
