<script lang="ts">
	import { onMount } from 'svelte';
	
	let appVersion = '4.0.20'; // Hardcoded version from package.json
</script>

<div class="min-h-screen bg-slate-950">
	<div class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Header Section -->
		<div class="text-center mb-12">
			<div class="flex justify-center mb-6">
				<img 
					src="/dillieo_digital_logo_192.png" 
					alt="Dillie-O Digital Logo" 
					class="h-24 w-24 rounded-2xl border-2 border-white/10 shadow-xl"
				/>
			</div>
			<h1 class="text-4xl font-bold text-white mb-2">Prayer Odyssey</h1>
			<p class="text-lg text-slate-400 mb-4">Created by Dillie-O Digital</p>
			<div class="inline-flex items-center rounded-full bg-indigo-500/10 px-4 py-2 border border-indigo-500/20">
				<span class="text-sm font-medium text-indigo-400">Version {appVersion}</span>
			</div>
		</div>

		<!-- Links Section -->
		<div class="grid gap-6 mb-12 sm:grid-cols-2">
			<div class="rounded-xl bg-slate-900/50 border border-white/10 p-6 backdrop-blur-sm">
				<div class="flex items-center space-x-3 mb-4">
					<div class="rounded-lg bg-indigo-500/20 p-3">
						<svg class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
						</svg>
					</div>
					<h2 class="text-xl font-semibold text-white">Website</h2>
				</div>
				<p class="text-slate-400 mb-4">Visit our main website for more information and resources.</p>
				<a 
					href="https://prayerodyssey.com" 
					target="_blank" 
					rel="noopener noreferrer"
					class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
				>
					Visit Website
					<svg class="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
					</svg>
				</a>
			</div>

			<div class="rounded-xl bg-slate-900/50 border border-white/10 p-6 backdrop-blur-sm">
				<div class="flex items-center space-x-3 mb-4">
					<div class="rounded-lg bg-indigo-500/20 p-3">
						<svg class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
						</svg>
					</div>
					<h2 class="text-xl font-semibold text-white">Discord Community</h2>
				</div>
				<p class="text-slate-400 mb-4">Join our Discord community to connect with other users and get support.</p>
				<a 
					href="https://discord.gg/7wfWS6sXXr" 
					target="_blank" 
					rel="noopener noreferrer"
					class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
				>
					Join Discord
					<svg class="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
					</svg>
				</a>
			</div>
		</div>

		<!-- Changelog Section -->
		<div class="rounded-xl bg-slate-900/50 border border-white/10 p-6 backdrop-blur-sm">
			<div class="flex items-center space-x-3 mb-6">
				<div class="rounded-lg bg-indigo-500/20 p-3">
					<svg class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
					</svg>
				</div>
				<h2 class="text-xl font-semibold text-white">Recent Updates</h2>
			</div>

			<div class="space-y-4">
				<div class="border-l-2 border-indigo-500/30 pl-4">
					<div class="flex items-center space-x-2 mb-2">
						<span class="text-sm font-medium text-indigo-400">Ver 4.0.20 - February 13, 2026</span>
						<span class="inline-flex items-center rounded-full bg-green-400/10 px-2 py-0.5 text-xs font-medium text-green-400">Latest</span>
					</div>
					<h3 class="text-lg font-medium text-white mb-2">Card View Enhancements</h3>
					<ul class="text-slate-400 space-y-1 text-sm">
						<li>• Added latest prayer update display in carousel/card view</li>
						<li>• Improved carousel layout to fit better in viewport</li>
						<li>• Enhanced navigation with better spacing</li>
					</ul>
				</div>

				<div class="border-l-2 border-slate-600/30 pl-4">
					<div class="flex items-center space-x-2 mb-2">
						<span class="text-sm font-medium text-slate-400">Ver 4.0.10 - February 12, 2026</span>
					</div>
					<h3 class="text-lg font-medium text-white mb-2">Group Features</h3>
					<ul class="text-slate-400 space-y-1 text-sm">
						<li>• Implemented group prayer sharing functionality</li>
						<li>• Added group member management</li>
						<li>• Enhanced group navigation and filtering</li>
					</ul>
				</div>

				<div class="border-l-2 border-slate-600/30 pl-4">
					<div class="flex items-center space-x-2 mb-2">
						<span class="text-sm font-medium text-slate-400">Ver 4.0 - February 10, 2026</span>
					</div>
					<h3 class="text-lg font-medium text-white mb-2">Core Features</h3>
					<ul class="text-slate-400 space-y-1 text-sm">
						<li>• Launched prayer tracking system</li>
						<li>• Implemented prayer status management</li>
						<li>• Added real-time notifications</li>
						<li>• Created responsive mobile navigation</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-12 text-center">
			<p class="text-slate-500 text-sm">
				© 2026 Prayer Odyssey. Made with ❤️ by Dillie-O Digital.
			</p>
		</div>
	</div>
</div>
