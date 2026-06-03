<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { prayers, type Prayer } from '$lib/stores/prayers';
	import PrayerCard from './PrayerCard.svelte';

	let { prayers: prayerList = $bindable($prayers) } = $props<{ prayers: Prayer[] }>();

	let currentIndex = $state(0);
	let touchStartX = $state(0);
	let touchEndX = $state(0);
	let isTransitioning = $state(false);

	// Derived values
	let currentPrayer = $derived(prayerList[currentIndex]);
	let hasPrevious = $derived(currentIndex > 0);
	let hasNext = $derived(currentIndex < prayerList.length - 1);
	let prayerCounter = $derived(
		prayerList.length > 0 ? `${currentIndex + 1} of ${prayerList.length}` : '0 of 0'
	);

	// Navigation functions
	function goToPrevious() {
		if (hasPrevious && !isTransitioning) {
			isTransitioning = true;
			currentIndex--;
			setTimeout(() => {
				isTransitioning = false;
			}, 300);
		}
	}

	function goToNext() {
		if (hasNext && !isTransitioning) {
			isTransitioning = true;
			currentIndex++;
			setTimeout(() => {
				isTransitioning = false;
			}, 300);
		}
	}

	function goToPrayer(index: number) {
		if (index !== currentIndex && !isTransitioning) {
			isTransitioning = true;
			currentIndex = index;
			setTimeout(() => {
				isTransitioning = false;
			}, 300);
		}
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			goToPrevious();
		} else if (event.key === 'ArrowRight') {
			goToNext();
		}
	}

	// Touch gesture handlers
	function handleTouchStart(event: TouchEvent) {
		touchStartX = event.changedTouches[0].screenX;
	}

	function handleTouchEnd(event: TouchEvent) {
		touchEndX = event.changedTouches[0].screenX;
		handleSwipeGesture();
	}

	// Detect if device is touch-capable (mobile/tablet)
	let isTouchDevice = $state(false);

	// Check device type on mount with more robust detection
	onMount(() => {
		// Simple and reliable touch detection
		// Check if touch is the primary input method
		const hasTouch = 'ontouchstart' in window;
		const isSmallScreen = window.matchMedia('(max-width: 1024px)').matches;

		// Consider it a touch device if it has touch capabilities AND is a smaller screen
		// This covers phones and tablets, excludes most desktops
		isTouchDevice = hasTouch && isSmallScreen;
	});

	function handleSwipeGesture() {
		const swipeThreshold = 50;
		const diff = touchStartX - touchEndX;

		if (Math.abs(diff) > swipeThreshold) {
			if (diff > 0) {
				// Swiped left - go to next
				goToNext();
			} else {
				// Swiped right - go to previous
				goToPrevious();
			}
		}
	}

	// Reset index when prayer list changes
	$effect(() => {
		if (prayerList.length === 0) {
			currentIndex = 0;
		} else if (currentIndex >= prayerList.length) {
			currentIndex = prayerList.length - 1;
		}
	});

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
	});
</script>

{#if prayerList.length === 0}
	<div class="py-12 text-center">
		<p class="text-slate-500 dark:text-slate-400">No prayers to display</p>
	</div>
{:else}
	<div class="space-y-4">
		<!-- Prayer Counter and Navigation -->
		<div class="flex items-center justify-between">
			<div class="text-sm font-medium text-slate-500 dark:text-slate-400">
				{prayerCounter}
			</div>

			<!-- Navigation Buttons -->
			<div class="flex items-center space-x-2">
				<button
					onclick={goToPrevious}
					disabled={!hasPrevious || isTransitioning}
					class="rounded-full border border-slate-900/10 bg-slate-200/80 p-3 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white"
					aria-label="Previous prayer"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>

				<button
					onclick={goToNext}
					disabled={!hasNext || isTransitioning}
					class="rounded-full border border-slate-900/10 bg-slate-200/80 p-3 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white"
					aria-label="Next prayer"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Main Prayer Display -->
		<div
			class="relative"
			role="region"
			aria-label="Prayer carousel"
			ontouchstart={handleTouchStart}
			ontouchend={handleTouchEnd}
		>
			<div
				class="transition-all duration-300 ease-in-out {isTransitioning
					? 'scale-95 opacity-50'
					: 'scale-100 opacity-100'} h-full"
			>
				<PrayerCard
					prayer={currentPrayer}
					showOwnerInfo={false}
					showGroupTags={true}
					showFullDescription={true}
					showLatestUpdate={true}
				/>
			</div>
		</div>

		<!-- Prayer Dots Indicator -->
		{#if prayerList.length > 1}
			<!-- On touch with many prayers, just show a compact position indicator -->
			{#if isTouchDevice && prayerList.length > 5}
				<div class="flex justify-center pt-2">
					<span
						class="rounded-full bg-slate-200/80 px-3 py-1 text-xs text-slate-400 dark:bg-slate-800/50 dark:text-slate-500"
						>{currentIndex + 1} / {prayerList.length}</span
					>
				</div>
			{:else}
				<div class="flex flex-wrap justify-center gap-0 pt-2">
					{#each prayerList as _, index}
						<button
							onclick={() => goToPrayer(index)}
							class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-all"
							aria-label={`Go to prayer ${index + 1}`}
						>
							<span
								class="block rounded-full transition-all {index === currentIndex
									? 'h-2 w-8 bg-indigo-500'
									: 'h-2 w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500'}"
							></span>
						</button>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Keyboard Navigation Hint -->
		<div class="text-center text-xs text-slate-400 dark:text-slate-500">
			{isTouchDevice ? 'Swipe to navigate' : 'Use arrow keys to navigate'}
		</div>
	</div>
{/if}
