<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  
  let email = '';
  let error: string | null = null;
  let loading = false;
  let resetEmailSent = false;

  async function handleResetPassword() {
    try {
      loading = true;
      error = null;
      await authStore.resetPassword(email);
      resetEmailSent = true;
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
        Reset your password
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enter your email address and we'll send you a link to reset your password.
      </p>
    </div>

    {#if resetEmailSent}
      <div class="rounded-md bg-green-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">
              Reset email sent
            </h3>
            <div class="mt-2 text-sm text-green-700">
              <p>Please check your email for instructions to reset your password.</p>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <form class="mt-8 space-y-6" on:submit|preventDefault={handleResetPassword}>
        {#if error}
          <div class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">{error}</div>
          </div>
        {/if}
        
        <div>
          <label for="email" class="sr-only">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            bind:value={email}
            class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm">
            <a href="/auth/login" class="font-medium text-primary hover:text-primary-dark">
              Back to login
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
            Send reset link
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>