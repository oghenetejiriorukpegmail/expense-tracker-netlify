<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  let isVerifyingEmail = false;
  let verificationError: string | null = null;
  let verificationSuccess: string | null = null;

  let isConnectingGoogle = false;
  let isConnectingGithub = false;
  let connectionError: string | null = null;

  $: user = $authStore.user;
  $: isEmailVerified = user?.emailVerified ?? false;

  async function sendVerificationEmail() {
    try {
      isVerifyingEmail = true;
      verificationError = null;
      
      if (!user) throw new Error('No user logged in');
      // TODO: Implement email verification resend
      
      verificationSuccess = 'Verification email sent. Please check your inbox.';
    } catch (e) {
      verificationError = (e as Error).message;
    } finally {
      isVerifyingEmail = false;
    }
  }

  async function connectGoogle() {
    try {
      isConnectingGoogle = true;
      connectionError = null;
      await authStore.loginWithGoogle();
    } catch (e) {
      connectionError = (e as Error).message;
    } finally {
      isConnectingGoogle = false;
    }
  }

  async function connectGithub() {
    try {
      isConnectingGithub = true;
      connectionError = null;
      await authStore.loginWithGithub();
    } catch (e) {
      connectionError = (e as Error).message;
    } finally {
      isConnectingGithub = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <h1 class="text-3xl font-bold mb-8">Security Settings</h1>

  <div class="space-y-8">
    <!-- Email Verification -->
    <div class="bg-base-100 rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Email Verification</h2>
      
      {#if isEmailVerified}
        <div class="flex items-center text-green-600">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          Your email is verified
        </div>
      {:else}
        <div class="mb-4">
          <div class="flex items-center text-yellow-600 mb-2">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            Your email is not verified
          </div>
          <button
            class="btn btn-primary"
            on:click={sendVerificationEmail}
            disabled={isVerifyingEmail}
          >
            {isVerifyingEmail ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>

        {#if verificationError}
          <p class="form-error">{verificationError}</p>
        {/if}
        {#if verificationSuccess}
          <p class="form-success">{verificationSuccess}</p>
        {/if}
      {/if}
    </div>

    <!-- Connected Accounts -->
    <div class="bg-base-100 rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Connected Accounts</h2>
      
      <div class="space-y-4">
        <div>
          <button
            class="btn w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            on:click={connectGoogle}
            disabled={isConnectingGoogle}
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            {isConnectingGoogle ? 'Connecting...' : 'Connect Google Account'}
          </button>
        </div>

        <div>
          <button
            class="btn w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
            on:click={connectGithub}
            disabled={isConnectingGithub}
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            {isConnectingGithub ? 'Connecting...' : 'Connect GitHub Account'}
          </button>
        </div>

        {#if connectionError}
          <p class="form-error">{connectionError}</p>
        {/if}
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-base-100 rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Recent Security Activity</h2>
      
      <div class="text-sm text-gray-500">
        <p>Coming soon: View your recent login history and security events.</p>
      </div>
    </div>
  </div>
</div>