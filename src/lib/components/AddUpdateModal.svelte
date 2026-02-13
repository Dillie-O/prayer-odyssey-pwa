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
    onkeydown={handleKeydown}
>
    <div class="flex min-h-full items-center justify-center p-4">
        <div 
            class="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-slate-900 text-left shadow-xl transition-all"
            class:scale-95={!isOpen}
            class:scale-100={isOpen}
            class:opacity-0={!isOpen}
            class:opacity-100={isOpen}
        >
            <div class="px-6 pb-4 pt-5 sm:p-6 sm:pb-6">
                <div class="flex items-start justify-between">
                    <h3 class="text-lg font-semibold leading-6 text-white">
                        Add Prayer Update
                    </h3>
                    <button
                        type="button"
                        class="text-gray-400 hover:text-gray-300 transition-colors"
                        onclick={handleClose}
                        disabled={isSubmitting}
                    >
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div class="mt-4">
                    <label for="update-content" class="block text-sm font-medium leading-6 text-gray-300">
                        Update Message
                    </label>
                    <div class="mt-2">
                        <textarea
                            id="update-content"
                            bind:value={newUpdateContent}
                            rows="4"
                            class="block w-full rounded-md border-0 bg-slate-950/50 py-3 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                            placeholder="Share an update on this prayer..."
                            disabled={isSubmitting}
                        ></textarea>
                    </div>
                    {#if errorMessage}
                        <p class="mt-2 text-sm text-rose-400">{errorMessage}</p>
                    {/if}
                </div>
            </div>
            
            <div class="px-6 py-3 bg-slate-800/50 sm:flex sm:flex-row-reverse sm:px-6 sm:py-3">
                <button
                    type="button"
                    class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:w-auto"
                    onclick={handleSubmit}
                    disabled={!newUpdateContent.trim() || isSubmitting}
                >
                    {isSubmitting ? 'Adding...' : 'Add Update'}
                </button>
                <button
                    type="button"
                    class="mt-3 inline-flex w-full justify-center rounded-md bg-white/5 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:mt-0 sm:w-auto"
                    onclick={handleClose}
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
</div>
