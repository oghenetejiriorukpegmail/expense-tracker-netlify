<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  
  let email = '';
  let password = '';
  let error: string | null = null;
  let loading = false;

  async function handleLogin() {
    try {
      loading = true;
      error = null;
      await authStore.login(email, password);
      goto('/dashboard');
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function handleGoogleLogin() {
    try {
      loading = true;
      error = null;
      await authStore.loginWithGoogle();
      goto('/dashboard');
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  async function handleGithubLogin() {
    try {
      loading = true;
      error = null;
      await authStore.loginWithGithub();
      goto('/dashboard');
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Sign in to your account
      </h2>
    </div>
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
      {#if error}
        <div class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">{error}</div>
        </div>
      {/if}
      
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="email" class="sr-only">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            bind:value={email}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>
        <div>
          <label for="password" class="sr-only">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            bind:value={password}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
            placeholder="Password"
          />
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="text-sm">
          <a href="/auth/reset-password" class="font-medium text-primary hover:text-primary-dark">
            Forgot your password?
          </a>
        </div>
        <div class="text-sm">
          <a href="/auth/register" class="font-medium text-primary hover:text-primary-dark">
            Create an account
          </a>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {#if loading}
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            </span>
          {/if}
          Sign in
        </button>
      </div>

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-gray-50 text-gray-500">Or continue with</span>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            on:click={handleGoogleLogin}
            disabled={loading}
            class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <img
              class="h-5 w-5"
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google logo"
            />
            <span class="ml-2">Google</span>
          </button>

          <button
            type="button"
            on:click={handleGithubLogin}
            disabled={loading}
            class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fill-rule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="ml-2">GitHub</span>
          </button>
        </div>
      </div>
    </form>
  </div>
</div>