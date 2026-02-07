<script lang="ts">
	import { goto } from '$app/navigation';
	import { user, loginWithGoogle, loginWithEmail, registerWithEmail } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let name = $state('');
	let isSignUp = $state(false);
	let isSubmitting = $state(false);
    let errorMessage = $state('');

	onMount(() => {
		if ($user) {
			goto('/');
		}
	});

	$effect(() => {
		if ($user) {
			goto('/');
		}
	});

	async function handleGoogleLogin() {
        console.log("Login button clicked");
        errorMessage = '';
		try {
			await loginWithGoogle();
            console.log("Login returned");
		} catch (e) {
			console.error("Login Error:", e);
            errorMessage = e instanceof Error ? e.message : String(e);
		}
	}

	async function handleEmailAuth() {
		if (!email || !password || (isSignUp && !name)) {
            errorMessage = "Please fill in all fields.";
            return;
        }

		isSubmitting = true;
        errorMessage = '';
        
		try {
			if (isSignUp) {
				await registerWithEmail(email, password, name);
			} else {
				await loginWithEmail(email, password);
			}
		} catch (e: any) {
			console.error("Auth Error:", e);
            // Provide friendlier error messages
            switch (e.code) {
                case 'auth/invalid-email': errorMessage = 'Invalid email address.'; break;
                case 'auth/user-disabled': errorMessage = 'This account has been disabled.'; break;
                case 'auth/user-not-found': errorMessage = 'No account found with this email.'; break;
                case 'auth/wrong-password': errorMessage = 'Incorrect password.'; break;
                case 'auth/email-already-in-use': errorMessage = 'Email already in use.'; break;
                case 'auth/weak-password': errorMessage = 'Password should be at least 6 characters.'; break;
                default: errorMessage = e.message || "An unexpected error occurred.";
            }
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="flex min-h-[80vh] flex-col items-center justify-center">
	<div class="w-full max-w-md space-y-8 rounded-2xl bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm ring-1 ring-white/10">
		<div class="text-center">
			<img src="/pwa-192x192.png" alt="Prayer Odyssey" class="mx-auto h-20 w-20 rounded-2xl shadow-lg shadow-indigo-500/20" />
			<h2 class="mt-6 text-3xl font-bold tracking-tight text-white">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
			<p class="mt-2 text-sm text-gray-400">{isSignUp ? 'Sign up to start your journey' : 'Sign in to track your prayer journey'}</p>
		</div>

        {#if errorMessage}
            <div class="rounded-md bg-red-400/10 p-4 border border-red-400/20">
                <div class="flex">
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-400">{errorMessage}</h3>
                    </div>
                </div>
            </div>
        {/if}

		<div class="mt-8 space-y-6">
            <div class="space-y-4">
                {#if isSignUp}
                    <div>
                        <label for="name" class="block text-sm font-medium leading-6 text-gray-300">Name</label>
                        <div class="mt-1">
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autocomplete="name"
                                required
                                bind:value={name}
                                class="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                                placeholder="Your Name"
                            />
                        </div>
                    </div>
                {/if}

                <div>
                    <label for="email" class="block text-sm font-medium leading-6 text-gray-300">Email address</label>
                    <div class="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            required
                            bind:value={email}
                            class="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium leading-6 text-gray-300">Password</label>
                    <div class="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autocomplete={isSignUp ? "new-password" : "current-password"}
                            required
                            bind:value={password}
                            class="block w-full rounded-md border-0 bg-white/5 py-2 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    onclick={handleEmailAuth}
                    disabled={isSubmitting}
                    class="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Processing...' : (isSignUp ? 'Sign up' : 'Sign in')}
                </button>
            </div>

            <div class="relative">
                <div class="absolute inset-0 flex items-center" aria-hidden="true">
                    <div class="w-full border-t border-gray-700"></div>
                </div>
                <div class="relative flex justify-center">
                    <span class="bg-slate-900 px-2 text-sm text-gray-400">Or continue with</span>
                </div>
            </div>

			<button
				onclick={handleGoogleLogin}
				class="group relative flex w-full justify-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
			>
				<span class="absolute inset-y-0 left-0 flex items-center pl-3">
					<svg class="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" viewBox="0 0 24 24" fill="currentColor">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
				</span>
				Sign in with Google
			</button>

            <div class="text-center mt-6">
                <button
                    onclick={() => { isSignUp = !isSignUp; errorMessage = ''; }}
                    class="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
            </div>
		</div>
	</div>
</div>
