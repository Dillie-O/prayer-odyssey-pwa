<script lang="ts">
    import { page } from '$app/stores';
    import { user } from '$lib/stores/auth';
    
    let path = $derived($page.url.pathname);

    const navItems = [
        { name: 'Home', href: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { name: 'Prayers', href: '/prayers', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { name: 'Groups', href: '/groups', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { name: 'About', href: '/about', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
    ];

    function isActive(href: string) {
        if (href === '/') return path === '/';
        return path.startsWith(href);
    }
</script>

{#if $user}
    <nav class="fixed bottom-0 left-0 z-50 w-full border-t border-white/10 bg-slate-950/80 backdrop-blur-md sm:hidden">
        <div class="flex h-16 items-center justify-around px-2">
            {#each navItems as item}
                <a 
                    href={item.href} 
                    class="flex flex-col items-center justify-center space-y-1 transition-colors {isActive(item.href) ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}"
                >
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
                    </svg>
                    <span class="text-[10px] font-medium">{item.name}</span>
                </a>
            {/each}
        </div>
    </nav>
{/if}
