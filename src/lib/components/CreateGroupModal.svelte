<script lang="ts">
	import { createGroup } from '$lib/stores/groups';

	let { isOpen = $bindable(false) } = $props();
	let name = $state('');
    let description = $state('');
	let isSubmitting = $state(false);

	async function handleSubmit() {
		if (!name.trim()) return;
		
		isSubmitting = true;
		try {
			await createGroup(name, description);
			name = '';
            description = '';
			isOpen = false;
		} catch (e) {
			console.error(e);
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
		<!-- Backdrop -->
		<div 
			class="fixed inset-0 bg-slate-950/20 backdrop-blur-sm dark:bg-slate-950/80 transition-opacity" 
			onclick={() => isOpen = false}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
		></div>

		<!-- Modal Panel -->
		<div class="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white border border-slate-200 dark:bg-gradient-to-b dark:from-slate-800/50 dark:to-slate-900 dark:border-white/10 p-6 text-left shadow-2xl transition-all sm:my-8">
			<div class="absolute right-4 top-4">
				<button 
					onclick={() => isOpen = false}
					class="text-gray-500 hover:text-slate-900 focus:outline-none dark:text-gray-400 dark:hover:text-white"
				>
					<span class="sr-only">Close</span>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="mt-2">
				<h3 class="text-xl font-semibold leading-6 text-slate-900 dark:text-white">Create New Group</h3>
				<div class="mt-4 space-y-4">
                    <div>
                        <label for="group-name" class="block text-sm font-medium leading-6 text-gray-600 dark:text-gray-300">Group Name</label>
                        <input
                            type="text"
                            bind:value={name}
                            id="group-name"
                            class="block w-full rounded-md border-0 bg-slate-100 py-2.5 text-slate-900 dark:bg-slate-950/50 dark:text-white shadow-sm ring-1 ring-inset ring-slate-900/10 placeholder:text-gray-400 dark:ring-white/10 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                            placeholder="e.g. Morning Prayer Warriors"
                        />
                    </div>
                    <div>
                        <label for="group-desc" class="block text-sm font-medium leading-6 text-gray-600 dark:text-gray-300">Description (Optional)</label>
                        <textarea
                            bind:value={description}
                            id="group-desc"
                            rows="3"
                            class="block w-full rounded-md border-0 bg-slate-100 py-2.5 text-slate-900 dark:bg-slate-950/50 dark:text-white shadow-sm ring-1 ring-inset ring-slate-900/10 placeholder:text-gray-400 dark:ring-white/10 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                            placeholder="What is this group about?"
                        ></textarea>
                    </div>
				</div>
			</div>

			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					class="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-900/10 hover:bg-slate-200 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10"
					onclick={() => isOpen = false}
				>
					Cancel
				</button>
				<button
					type="button"
					class="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={handleSubmit}
					disabled={!name.trim() || isSubmitting}
				>
					{isSubmitting ? 'Creating...' : 'Create Group'}
				</button>
			</div>
		</div>
	</div>
{/if}
