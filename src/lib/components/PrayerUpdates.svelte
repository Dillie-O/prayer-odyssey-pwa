<script lang="ts">
	import { addPrayerUpdate, editPrayerUpdate, deletePrayerUpdate, type PrayerUpdate } from '$lib/stores/prayers';
	import { user } from '$lib/stores/auth';
	
	let { prayerId, updates, isOpen = $bindable(false) } = $props<{ prayerId: string; updates: PrayerUpdate[]; isOpen: boolean }>();
	let newUpdateContent = $state('');
	let editingUpdateId = $state<string | null>(null);
	let editContent = $state('');
	let isSubmitting = $state(false);

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
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
		<!-- Backdrop -->
		<div 
			class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
			onclick={() => isOpen = false}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
		></div>

		<!-- Modal Panel -->
		<div class="relative w-full max-w-2xl max-h-[80vh] transform overflow-hidden rounded-xl bg-slate-900 border border-white/10 text-left shadow-2xl transition-all sm:my-8 bg-gradient-to-b from-slate-800/50 to-slate-900 flex flex-col">
			<div class="p-6 border-b border-white/10">
				<div class="flex items-center justify-between">
					<h3 class="text-xl font-semibold leading-6 text-white">Prayer Updates</h3>
					<button 
						onclick={() => isOpen = false}
						class="text-gray-400 hover:text-white focus:outline-none"
					>
						<span class="sr-only">Close</span>
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<div class="flex-1 overflow-y-auto p-6 space-y-4">
				<!-- Add New Update -->
				<div class="rounded-lg bg-slate-800/50 border border-white/10 p-4">
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
		</div>
	</div>
{/if}
