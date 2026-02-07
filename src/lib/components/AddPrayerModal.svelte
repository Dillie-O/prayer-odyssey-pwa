<script lang="ts">
	import { addPrayer } from '$lib/stores/prayers';
    import { groups } from '$lib/stores/groups';
	
	let { isOpen = $bindable(false) } = $props();
	let content = $state('');
    let selectedGroups = $state<string[]>([]);
	let isSubmitting = $state(false);
	let errorMessage = $state('');

	async function handleSubmit() {
		if (!content.trim()) return;
		
		isSubmitting = true;
		errorMessage = '';
		try {
			await addPrayer(content, selectedGroups);
			content = '';
            selectedGroups = [];
			isOpen = false;
		} catch (e: any) {
			console.error(e);
			errorMessage = e.message || 'Failed to save prayer. Please try again.';
		} finally {
			isSubmitting = false;
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
		<div class="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-slate-900 border border-white/10 p-6 text-left shadow-2xl transition-all sm:my-8 bg-gradient-to-b from-slate-800/50 to-slate-900">
			<div class="absolute right-4 top-4">
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

			<div class="mt-2">
				<h3 class="text-xl font-semibold leading-6 text-white">New Prayer Request</h3>
				<div class="mt-4">
					{#if errorMessage}
						<div class="mb-4 rounded-md bg-red-500/10 p-4 border border-red-500/20">
							<div class="flex">
								<div class="flex-shrink-0">
									<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
									</svg>
								</div>
								<div class="ml-3">
									<h3 class="text-sm font-medium text-red-400">Error</h3>
									<div class="mt-2 text-sm text-red-400/90">
										<p>{errorMessage}</p>
									</div>
								</div>
							</div>
						</div>
					{/if}
					<textarea
						bind:value={content}
						rows="4"
						class="block w-full rounded-md border-0 bg-slate-950/50 py-3 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
						placeholder="What would you like to pray for?"
                        autofocus
					></textarea>
				</div>
                
                {#if $groups.length > 0}
                    <div class="mt-4">
                        <label class="block text-sm font-medium leading-6 text-gray-300 mb-2">Share with groups (optional)</label>
                        <div class="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {#each $groups as group}
                                <label class="flex items-center space-x-3 rounded-lg border border-white/5 bg-white/5 p-3 hover:bg-white/10 transition-colors cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        value={group.id} 
                                        bind:group={selectedGroups}
                                        class="h-4 w-4 rounded border-gray-600 bg-slate-800 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900"
                                    />
                                    <span class="text-sm font-medium text-white">{group.name}</span>
                                </label>
                            {/each}
                        </div>
                    </div>
                {/if}
			</div>

			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					class="rounded-md bg-white/5 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/10"
					onclick={() => isOpen = false}
				>
					Cancel
				</button>
				<button
					type="button"
					class="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={handleSubmit}
					disabled={!content.trim() || isSubmitting}
				>
					{isSubmitting ? 'Saving...' : 'Save Prayer'}
				</button>
			</div>
		</div>
	</div>
{/if}
