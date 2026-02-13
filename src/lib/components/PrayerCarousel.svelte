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
	let prayerCounter = $derived(prayerList.length > 0 ? `${currentIndex + 1} of ${prayerList.length}` : '0 of 0');
	
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
	<div class="text-center py-12">
		<p class="text-slate-400">No prayers to display</p>
	</div>
{:else}
	<div class="space-y-4">
		<!-- Prayer Counter and Navigation -->
		<div class="flex items-center justify-between">
			<div class="text-sm text-slate-400 font-medium">
				{prayerCounter}
			</div>
			
			<!-- Navigation Buttons -->
			<div class="flex items-center space-x-2">
				<button
					onclick={goToPrevious}
					disabled={!hasPrevious || isTransitioning}
					class="p-2 rounded-full bg-slate-800/50 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
					aria-label="Previous prayer"
				>
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				
				<button
					onclick={goToNext}
					disabled={!hasNext || isTransitioning}
					class="p-2 rounded-full bg-slate-800/50 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
					aria-label="Next prayer"
				>
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
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
			<div class="transition-all duration-300 ease-in-out {isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} h-full">
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
			<div class="flex justify-center space-x-2 pt-2">
				{#each prayerList as _, index}
					<button
						onclick={() => goToPrayer(index)}
						class="w-2 h-2 rounded-full transition-all {index === currentIndex ? 'bg-indigo-500 w-8' : 'bg-slate-600 hover:bg-slate-500'}"
						aria-label={`Go to prayer ${index + 1}`}
					></button>
				{/each}
			</div>
		{/if}
		
		<!-- Keyboard Navigation Hint -->
		<div class="text-center text-xs text-slate-500">
			{isTouchDevice ? 'Swipe to navigate' : 'Use arrow keys to navigate'}
		</div>
	</div>
{/if}
