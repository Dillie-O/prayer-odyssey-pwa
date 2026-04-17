<script lang="ts">
    import { addPrayerUpdate } from '$lib/stores/prayers';
    
    let { isOpen = $bindable(false), prayerId = '' } = $props<{
        isOpen: boolean;
        prayerId: string;
    }>();
    
    let newUpdateContent = $state('');
    let isSubmitting = $state(false);
    let errorMessage = $state('');
    
    async function handleSubmit() {
        if (!newUpdateContent.trim()) return;
        
        isSubmitting = true;
        errorMessage = '';
        try {
            await addPrayerUpdate(prayerId, newUpdateContent.trim());
            newUpdateContent = '';
            isOpen = false;
        } catch (e: any) {
            console.error(e);
            errorMessage = 'Failed to add update. Please try again.';
        } finally {
            isSubmitting = false;
        }
    }
    
    function handleClose() {
        if (!isSubmitting) {
            isOpen = false;
            newUpdateContent = '';
            errorMessage = '';
        }
    }
    
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            handleClose();
        }
    }
</script>

<div 
    class="fixed inset-0 z-50 overflow-y-auto"
    class:opacity-100={isOpen}
    class:invisible={!isOpen}
    class:transition-opacity={isOpen}
    role="dialog"
    aria-modal="true"
    aria-label="Add Prayer Update"
    tabindex="-1"
    onkeydown={handleKeydown}
>
    <div class="flex min-h-full items-center justify-center p-4">
        <!-- Backdrop -->
        <div
            class="fixed inset-0 bg-slate-950/20 backdrop-blur-sm dark:bg-slate-950/80"
            role="button"
            tabindex="0"
            onclick={handleClose}
            onkeydown={(e) => e.key === 'Escape' && handleClose()}
            aria-label="Close modal"
        ></div>

        <div 
            class="relative z-10 w-full max-w-lg transform overflow-hidden rounded-xl bg-white border border-slate-200 text-left shadow-xl transition-all dark:bg-slate-900 dark:border-white/10"
            class:scale-95={!isOpen}
            class:scale-100={isOpen}
            class:opacity-0={!isOpen}
            class:opacity-100={isOpen}
        >
            <div class="px-6 pb-4 pt-5 sm:p-6 sm:pb-6">
                <div class="flex items-start justify-between">
                    <h3 class="text-lg font-semibold leading-6 text-slate-900 dark:text-white">
                        Add Prayer Update
                    </h3>
                    <button
                        type="button"
                        aria-label="Close modal"
                        class="p-2 text-gray-500 hover:text-slate-700 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-white/5 rounded-md transition-colors"
                        onclick={handleClose}
                        disabled={isSubmitting}
                    >
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div class="mt-4">
                    <label for="update-content" class="block text-sm font-medium leading-6 text-gray-600 dark:text-gray-300">
                        Update Message
                    </label>
                    <div class="mt-2">
                        <textarea
                            id="update-content"
                            bind:value={newUpdateContent}
                            rows="4"
                            class="block w-full rounded-md border-0 bg-slate-100 py-3 px-4 text-slate-900 dark:bg-slate-950/50 dark:text-white shadow-sm ring-1 ring-inset ring-slate-900/10 placeholder:text-gray-400 dark:ring-white/10 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                            placeholder="Share an update on this prayer..."
                            disabled={isSubmitting}
                        ></textarea>
                    </div>
                    {#if errorMessage}
                        <p class="mt-2 text-sm text-rose-400">{errorMessage}</p>
                    {/if}
                </div>
            </div>
            
            <div class="px-6 py-3 bg-slate-100/80 sm:flex dark:bg-slate-800/50 sm:flex-row-reverse sm:px-6 sm:py-3">
                <button
                    type="button"
                    class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:w-auto"
                    onclick={handleSubmit}
                    disabled={!newUpdateContent.trim() || isSubmitting}
                >
                    {isSubmitting ? 'Adding...' : 'Add Update'}
                </button>
                <button
                    type="button"
                    class="mt-3 inline-flex w-full justify-center rounded-md bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-900/10 hover:bg-slate-200 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:mt-0 sm:w-auto"
                    onclick={handleClose}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
</div>
