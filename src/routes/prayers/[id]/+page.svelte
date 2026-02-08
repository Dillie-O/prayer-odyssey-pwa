<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { db } from '$lib/firebase';
	import { doc, getDoc, onSnapshot } from 'firebase/firestore';
	import { onMount, onDestroy } from 'svelte';
	import { user } from '$lib/stores/auth';
	import { subscribeToPrayerUpdates, prayerUpdates, addPrayerUpdate, editPrayerUpdate, deletePrayerUpdate, updatePrayer, deletePrayer, markAnswered, type Prayer, type PrayerUpdate } from '$lib/stores/prayers';
	import EditPrayerModal from '$lib/components/EditPrayerModal.svelte';
	
	let prayerId = $derived($page.params.id);
	let prayer = $state<Prayer | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let unsubscribePrayer: (() => void) | null = null;
	let unsubscribeUpdates: (() => void) | null = null;
	
	let showEditModal = $state(false);
	let newUpdateContent = $state('');
	let editingUpdateId = $state<string | null>(null);
	let editContent = $state('');
	let isSubmitting = $state(false);
	
	let updates = $derived($prayerUpdates[prayerId] || []);

	onMount(() => {
		if (!prayerId) {
			error = 'Invalid prayer ID';
			loading = false;
			return;
		}

		// Subscribe to prayer document
		unsubscribePrayer = onSnapshot(
			doc(db, 'prayers', prayerId),
			(snapshot) => {
				if (snapshot.exists()) {
					prayer = { id: snapshot.id, ...snapshot.data() } as Prayer;
					loading = false;
				} else {
					error = 'Prayer not found';
					loading = false;
				}
			},
			(err) => {
				console.error('Error fetching prayer:', err);
				error = 'Failed to load prayer';
				loading = false;
			}
		);

		// Subscribe to updates
		unsubscribeUpdates = subscribeToPrayerUpdates(prayerId);
	});

	onDestroy(() => {
		if (unsubscribePrayer) unsubscribePrayer();
		if (unsubscribeUpdates) unsubscribeUpdates();
	});

	async function handleAddUpdate() {
		if (!newUpdateContent.trim()) return;
		
		isSubmitting = true;
		try {
			await addPrayerUpdate(prayerId, newUpdateContent);
			newUpdateContent = '';
		} catch (e: any) {
			console.error(e);
			alert('Failed to add update. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}
	
	function startEdit(update: PrayerUpdate) {
		editingUpdateId = update.id;
		editContent = update.content;
	}
	
	function cancelEdit() {
		editingUpdateId = null;
		editContent = '';
	}
	
	async function handleEditUpdate(updateId: string) {
		if (!editContent.trim()) return;
		
		isSubmitting = true;
		try {
			await editPrayerUpdate(prayerId, updateId, editContent);
			editingUpdateId = null;
			editContent = '';
		} catch (e: any) {
			console.error(e);
			alert('Failed to edit update. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}
	
	async function handleDeleteUpdate(updateId: string) {
		if (!confirm('Are you sure you want to delete this update?')) return;
		
		try {
			await deletePrayerUpdate(prayerId, updateId);
		} catch (e: any) {
			console.error(e);
			alert('Failed to delete update. Please try again.');
		}
	}
	
	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this prayer?')) return;
		
		try {
			await deletePrayer(prayerId);
			goto('/');
		} catch (e: any) {
			console.error(e);
			alert('Failed to delete prayer. Please try again.');
		}
	}

	async function handleAnswered() {
		try {
			await markAnswered(prayerId);
		} catch (e: any) {
			console.error(e);
			alert('Failed to mark as answered. Please try again.');
		}
	}
</script>

{#if loading}
	<div class="flex h-[calc(100vh-10rem)] items-center justify-center">
		<div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
	</div>
{:else if error || !prayer}
	<div class="text-center py-24">
		<h2 class="text-2xl font-bold text-white">{error || 'Prayer not found'}</h2>
		<a href="/" class="mt-4 inline-block text-indigo-400 hover:text-indigo-300">Back to Prayers</a>
	</div>
{:else}
	<div class="max-w-4xl mx-auto space-y-6">
		<!-- Header with back button -->
		<div class="flex items-center gap-3">
			<a href="/" class="text-gray-400 hover:text-white transition-colors" aria-label="Back to prayers">
				<svg class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
				</svg>
			</a>
			<h1 class="text-2xl font-bold text-white">Prayer Details</h1>
		</div>

		<!-- Prayer Card -->
		<div class="rounded-xl bg-slate-900/50 border border-white/10 p-6 backdrop-blur-sm">
			<div class="flex justify-between items-start mb-4">
				<div class="flex-1">
					{#if prayer.summary && prayer.description}
						<h2 class="text-2xl font-bold text-white mb-3">{prayer.summary}</h2>
						<p class="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">{prayer.description}</p>
					{:else if (prayer as any).content}
						<p class="text-xl text-slate-200 leading-relaxed whitespace-pre-wrap">{(prayer as any).content}</p>
					{:else}
						<p class="text-slate-500 italic">No content available</p>
					{/if}
				</div>
				
				<div class="flex items-center space-x-2 ml-4">
					<button 
						onclick={() => showEditModal = true}
						class="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full transition-colors"
						title="Edit Prayer"
					>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
					</button>
					
					{#if prayer.status !== 'answered'}
						<button 
							onclick={handleAnswered}
							class="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 rounded-full transition-colors"
							title="Mark as Answered"
						>
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M12 14.5c.667 0 1.333-.333 2-1 1.333-1.333 1.333-3.333 0-4.667l-2-2.333-2 2.333c-1.333 1.333-1.333 3.333 0 4.667.667.667 1.333 1 2 1Z" />
								<path d="M17.5 19c3-2 4.5-4.5 4.5-7.5H2c0 3 1.5 5.5 4.5 7.5.667 0 1.333-.333 2-1a4 4 0 0 0 6 0c.667.667 1.333 1 2 1" />
							</svg>
						</button>
					{/if}
					
					<button 
						onclick={handleDelete}
						class="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-full transition-colors"
						title="Delete"
					>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				</div>
			</div>
			
			<div class="flex items-center justify-between pt-4 border-t border-white/10">
				<span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset {prayer.status === 'answered' ? 'bg-green-400/10 text-green-400 ring-green-400/20' : 'bg-indigo-400/10 text-indigo-400 ring-indigo-400/30'}">
					{prayer.status.charAt(0).toUpperCase() + prayer.status.slice(1)}
				</span>
				<span class="text-sm text-slate-500">
					Created {prayer.createdAt?.toDate().toLocaleDateString() || 'Just now'}
				</span>
			</div>
		</div>

		<!-- Updates Section -->
		<div class="rounded-xl bg-slate-900/50 border border-white/10 p-6 backdrop-blur-sm">
			<h3 class="text-xl font-semibold text-white mb-4">Updates</h3>
			
			<!-- Updates List -->
			<div class="space-y-3">
				{#each updates as update (update.id)}
					<div class="rounded-lg bg-slate-800/30 border border-white/5 p-4">
						{#if editingUpdateId === update.id}
							<!-- Edit Mode -->
							<textarea
								bind:value={editContent}
								rows="3"
								class="block w-full rounded-md border-0 bg-slate-950/50 py-3 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
							></textarea>
							<div class="mt-3 flex justify-end gap-2">
								<button
									type="button"
									class="rounded-md bg-white/5 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/10"
									onclick={cancelEdit}
								>
									Cancel
								</button>
								<button
									type="button"
									class="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
									onclick={() => handleEditUpdate(update.id)}
									disabled={!editContent.trim() || isSubmitting}
								>
									{isSubmitting ? 'Saving...' : 'Save'}
								</button>
							</div>
						{:else}
							<!-- View Mode -->
							<p class="text-slate-200 whitespace-pre-wrap">{update.content}</p>
							<div class="mt-3 flex items-center justify-between">
								<span class="text-xs text-slate-500">
									{update.createdAt?.toDate().toLocaleString() || 'Just now'}
									{#if update.updatedAt}
										<span class="text-slate-600"> (edited)</span>
									{/if}
								</span>
								{#if $user && update.authorId === $user.uid}
									<div class="flex gap-2">
										<button
											onclick={() => startEdit(update)}
											class="text-xs text-blue-400 hover:text-blue-300"
										>
											Edit
										</button>
										<button
											onclick={() => handleDeleteUpdate(update.id)}
											class="text-xs text-rose-400 hover:text-rose-300"
										>
											Delete
										</button>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
				
				{#if updates.length === 0}
					<div class="text-center py-8 text-gray-500">
						No updates yet. Add the first update above!
					</div>
				{/if}
			</div>

			
		</div>

		<!-- Add New Update -->
			<div class="mb-6 rounded-lg bg-slate-800/50 border border-white/10 p-4">
				<label for="new-update" class="block text-sm font-medium leading-6 text-gray-300 mb-2">
					Add Update
				</label>
				<textarea
					id="new-update"
					bind:value={newUpdateContent}
					rows="3"
					class="block w-full rounded-md border-0 bg-slate-950/50 py-3 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
					placeholder="Share an update on this prayer..."
				></textarea>
				<div class="mt-3 flex justify-end">
					<button
						type="button"
						class="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
						onclick={handleAddUpdate}
						disabled={!newUpdateContent.trim() || isSubmitting}
					>
						{isSubmitting ? 'Adding...' : 'Add Update'}
					</button>
				</div>
			</div>
	</div>

	<EditPrayerModal {prayer} bind:isOpen={showEditModal} />
{/if}
