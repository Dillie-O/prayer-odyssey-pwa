<script lang="ts">
	import { user, logout } from '$lib/stores/auth';
	
	let isOpen = false;
</script>

<nav class="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<div class="flex items-center">
			<a href="/" class="flex items-center space-x-3">
				<img src="/prayer_icon_logo_192.png" alt="Logo" class="h-8 w-8 rounded-lg" />
				<span class="text-lg font-bold text-white">Prayer Odyssey</span>
			</a>
		</div>

		<div class="flex items-center space-x-4">
			{#if $user}
				<div class="relative">
					<button 
						class="flex items-center space-x-2 rounded-full bg-slate-800 p-1 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
						onclick={() => isOpen = !isOpen}
					>
						<img 
							src={$user.photoURL || `https://ui-avatars.com/api/?name=${$user.displayName}`} 
							alt="Profile" 
							class="h-8 w-8 rounded-full" 
						/>
						<span class="text-sm font-medium text-white hidden sm:block">{$user.displayName}</span>
					</button>

					{#if isOpen}
						<div class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-slate-900 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-white/10">
							<a href="/profile" class="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-800">Your Profile</a>
							<button 
								onclick={logout}
								class="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-slate-800"
							>
								Sign out
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<a href="/login" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
					Sign In
				</a>
			{/if}
		</div>
	</div>
</nav>
<div class="h-16"></div> <!-- Spacer -->
