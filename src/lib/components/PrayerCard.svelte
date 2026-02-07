<script lang="ts">
	import { deletePrayer, markAnswered, type Prayer } from '$lib/stores/prayers';
    
    let { prayer } = $props<{ prayer: Prayer }>();
    
    async function handleDelete() {
        if (confirm('Are you sure you want to delete this prayer?')) {
            await deletePrayer(prayer.id);
        }
    }

    async function handleAnswered() {
        await markAnswered(prayer.id);
    }
</script>

<div class="relative overflow-hidden rounded-xl bg-slate-900/50 border border-white/10 p-6 backdrop-blur-sm transition-all hover:bg-slate-900/80 hover:border-indigo-500/30 group">
    <div class="flex justify-between items-start">
        <p class="text-lg text-slate-200 leading-relaxed whitespace-pre-wrap">{prayer.content}</p>
        
        <div class="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {#if prayer.status !== 'answered'}
                <button 
                    onclick={handleAnswered}
                    class="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10 rounded-full transition-colors"
                    title="Mark as Answered"
                >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
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
    
    <div class="mt-4 flex items-center justify-between">
        <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset {prayer.status === 'answered' ? 'bg-green-400/10 text-green-400 ring-green-400/20' : 'bg-indigo-400/10 text-indigo-400 ring-indigo-400/30'}">
            {prayer.status.charAt(0).toUpperCase() + prayer.status.slice(1)}
        </span>
        <span class="text-xs text-slate-500">
            {prayer.createdAt?.toDate().toLocaleDateString() || 'Just now'}
        </span>
    </div>
</div>
