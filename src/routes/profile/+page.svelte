<script lang="ts">
    import { version as appVersion } from '$app/environment';
    import { exportPrayerData, fetchOwnedPrayerExportData, openPrayerExportLoadingWindow, type PrayerExportDateRange, type PrayerExportFormat } from '$lib/utils/prayerExport';
    import { user, logout } from '$lib/stores/auth';
    import { requestNotificationPermission, disableFCMNotifications, clearAllFCMTokens, notificationPermission, fcmToken } from '$lib/stores/notifications';
    
    let isRequesting = $state(false);
    let isDisabling = $state(false);
    let isClearingAll = $state(false);
    let isExporting = $state(false);
    let showAdvancedSettings = $state(false);
    let exportFormat = $state<PrayerExportFormat>('json');
    let exportStartDate = $state('');
    let exportEndDate = $state('');
    let exportStatusMessage = $state('');
    let exportError = $state('');

    const exportFormatDescriptions: Record<PrayerExportFormat, string> = {
        json: 'Full-fidelity backup that is best for future imports or scripting.',
        csv: 'Spreadsheet-friendly ZIP with separate prayer, update, and summary files.',
        markdown: 'Plain text journal you can read or edit in most note-taking apps.',
        docx: 'Word document for continuing journaling in Microsoft Word, Pages, or Google Docs.',
        print: 'Print-ready journal in a new tab for physical printing or saving as a PDF.'
    };

    async function handleEnableNotifications() {
        isRequesting = true;
        await requestNotificationPermission();
        isRequesting = false;
    }

    async function handleDisableNotifications() {
        isDisabling = true;
        try {
            await disableFCMNotifications();
        } catch (error) {
            console.error('Failed to disable notifications:', error);
        }
        isDisabling = false;
    }

    async function handleClearAllNotifications() {
        if (confirm('This will remove all push notification tokens from all your devices. Are you sure?')) {
            isClearingAll = true;
            try {
                await clearAllFCMTokens();
            } catch (error) {
                console.error('Failed to clear all notifications:', error);
            }
            isClearingAll = false;
        }
    }

    async function handleExportData() {
        if (!$user || isExporting) return;

        let printWindow: Window | null = null;
        exportError = '';
        exportStatusMessage = exportFormat === 'print' ? 'Preparing your print-ready journal...' : 'Preparing your export...';

        if (exportStartDate && exportEndDate && exportStartDate > exportEndDate) {
            exportStatusMessage = '';
            exportError = 'Start date must be on or before the end date.';
            return;
        }

        if (exportFormat === 'print') {
            printWindow = openPrayerExportLoadingWindow();
            if (!printWindow) {
                exportStatusMessage = '';
                exportError = 'Please allow pop-ups to open the print-ready journal.';
                return;
            }
        }

        isExporting = true;

        try {
            const dateRange: PrayerExportDateRange = {
                startDate: exportStartDate || null,
                endDate: exportEndDate || null
            };
            const exportData = await fetchOwnedPrayerExportData(appVersion, dateRange);
            await exportPrayerData(exportFormat, exportData, printWindow);
            exportStatusMessage = exportFormat === 'print'
                ? 'Opened your print-ready journal in a new tab.'
                : 'Your export is ready to download.';
        } catch (error) {
            console.error('Failed to export prayer data:', error);
            exportStatusMessage = '';
            exportError = 'Unable to export your prayer data right now. Please try again.';
            printWindow?.close();
        } finally {
            isExporting = false;
        }
    }

    // Check if FCM notifications are actually enabled (has token + browser permission)
    const isFCMEnabled = $derived($notificationPermission === 'granted' && $fcmToken !== null);
</script>

<div class="space-y-6 max-w-2xl mx-auto">
    <header>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Manage your account and settings</p>
    </header>

    {#if $user}
        <div class="rounded-xl bg-white/80 border border-slate-900/10 p-6 backdrop-blur-sm dark:bg-slate-900/50 dark:border-white/10">
            <div class="flex items-center space-x-4">
                <img 
                    src={$user.photoURL || `https://ui-avatars.com/api/?name=${$user.displayName}`} 
                    alt="Profile" 
                    class="h-16 w-16 rounded-full border-2 border-indigo-500/50" 
                />
                <div>
                    <h2 class="text-xl font-semibold text-slate-900 dark:text-white">{$user.displayName}</h2>
                    <p class="text-gray-500 dark:text-gray-400">{$user.email}</p>
                </div>
            </div>
            
            <div class="mt-8 border-t border-slate-900/10 dark:border-white/10 pt-6">
                <h3 class="text-lg font-medium text-slate-900 mb-4 dark:text-white">Notifications</h3>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-slate-900 font-medium dark:text-white">Push Notifications</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Receive updates when someone prays for you</p>
                    </div>
                    {#if isFCMEnabled}
                        <button 
                            onclick={handleDisableNotifications}
                            disabled={isDisabling}
                            class="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 transition-colors"
                        >
                            {isDisabling ? 'Disabling...' : 'Disable'}
                        </button>
                    {:else if $notificationPermission === 'denied'}
                        <span class="inline-flex items-center rounded-md bg-red-400/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
                            Denied
                        </span>
                    {:else}
                         <button 
                            onclick={handleEnableNotifications}
                            disabled={isRequesting}
                            class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors"
                        >
                            {isRequesting ? 'Enabling...' : 'Enable Notifications'}
                        </button>
                    {/if}
                </div>

                <!-- Advanced Settings Section -->
                <div class="mt-6 border-t border-white/5 pt-6">
                    <button 
                        onclick={() => showAdvancedSettings = !showAdvancedSettings}
                        class="flex items-center gap-2 text-sm text-gray-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        <svg 
                            class="w-4 h-4 transition-transform" 
                            class:rotate-180={showAdvancedSettings}
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        Advanced Settings
                    </button>
                    
                    {#if showAdvancedSettings}
                        <div class="mt-4 space-y-4">
                            <div class="p-4 rounded-lg bg-slate-100/80 border border-slate-900/10 dark:bg-slate-800/30 dark:border-white/5">
                                <div class="space-y-4">
                                    <div>
                                        <p class="text-slate-900 font-medium text-sm dark:text-white">Export My Data</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">Download your prayers, updates, and prayer counts in the format that works best for you.</p>
                                    </div>

                                    <label class="block space-y-2">
                                        <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Format</span>
                                        <select
                                            bind:value={exportFormat}
                                            class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                                        >
                                            <option value="json">JSON</option>
                                            <option value="csv">CSV (ZIP)</option>
                                            <option value="markdown">Markdown</option>
                                            <option value="docx">Word (.docx)</option>
                                            <option value="print">Print or Save as PDF</option>
                                        </select>
                                    </label>

                                    <p class="text-xs text-gray-500 dark:text-gray-400">{exportFormatDescriptions[exportFormat]}</p>

                                    <div class="grid gap-3 sm:grid-cols-2">
                                        <label class="block space-y-2">
                                            <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Start Date (optional)</span>
                                            <input
                                                type="date"
                                                bind:value={exportStartDate}
                                                class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                                            />
                                        </label>

                                        <label class="block space-y-2">
                                            <span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">End Date (optional)</span>
                                            <input
                                                type="date"
                                                bind:value={exportEndDate}
                                                class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                                            />
                                        </label>
                                    </div>

                                    <div class="flex items-center justify-between gap-4">
                                        <div class="min-h-[2.5rem] text-xs">
                                            {#if exportError}
                                                <p class="text-red-500 dark:text-red-400">{exportError}</p>
                                            {:else if exportStatusMessage}
                                                <p class="text-gray-500 dark:text-gray-400">{exportStatusMessage}</p>
                                            {/if}
                                        </div>

                                        <button
                                            onclick={handleExportData}
                                            disabled={isExporting}
                                            class="shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors"
                                        >
                                            {isExporting ? 'Preparing…' : exportFormat === 'print' ? 'Open Print View' : 'Export My Data'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="p-4 rounded-lg bg-slate-100/80 border border-slate-900/10 dark:bg-slate-800/30 dark:border-white/5">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-slate-900 font-medium text-sm dark:text-white">Clear All Devices</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">Remove push notifications from all browsers and devices</p>
                                </div>
                                {#if $notificationPermission === 'granted' || $fcmToken !== null}
                                    <button 
                                        onclick={handleClearAllNotifications}
                                        disabled={isClearingAll}
                                        class="rounded-md bg-gray-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 disabled:opacity-50 transition-colors"
                                    >
                                        {isClearingAll ? 'Clearing...' : 'Clear All'}
                                    </button>
                                {:else}
                                    <span class="text-xs text-gray-400 dark:text-gray-500">No active devices</span>
                                {/if}
                            </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="mt-8 border-t border-slate-900/10 dark:border-white/10 pt-6">
                <button 
                    onclick={logout}
                    class="w-full rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-red-500 shadow-sm ring-1 ring-inset ring-slate-900/10 hover:bg-slate-200 hover:text-red-600 dark:bg-white/5 dark:text-red-400 dark:ring-white/10 dark:hover:bg-white/10 dark:hover:text-red-300 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    {/if}
</div>
