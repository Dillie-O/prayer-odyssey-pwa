import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type ViewMode = 'list' | 'carousel';

const STORAGE_KEY = 'prayerViewMode';

function getInitialViewMode(): ViewMode {
	if (!browser) return 'list';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'list' || stored === 'carousel') return stored;
	return 'list';
}

function createViewModeStore() {
	const { subscribe, set } = writable<ViewMode>(getInitialViewMode());

	function setViewMode(mode: ViewMode) {
		if (browser) {
			localStorage.setItem(STORAGE_KEY, mode);
		}
		set(mode);
	}

	return { subscribe, set: setViewMode };
}

export const viewMode = createViewModeStore();
