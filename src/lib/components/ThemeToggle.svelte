<script lang="ts">
	import { theme } from '$lib/stores/theme';

	let isDark = $state(false);

	// Sync initial state from DOM
	$effect(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function handleToggle() {
		theme.toggle();
		isDark = document.documentElement.classList.contains('dark');
	}
</script>

<button
	onclick={handleToggle}
	class="rounded-full p-3 text-slate-500 transition-colors hover:bg-slate-900/10 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
	aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
	title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
	{#if isDark}
		<!-- Sun icon -->
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z"
			/>
		</svg>
	{:else}
		<!-- Moon icon -->
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
			/>
		</svg>
	{/if}
</button>
