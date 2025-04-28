<script lang="ts">
  import { profileStore } from '$lib/stores/profile';
  import { authStore } from '$lib/stores/auth';

  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let isChangingPassword = false;
  let passwordError: string | null = null;
  let passwordSuccess: string | null = null;

  let avatarFile: FileList | null = null;
  let isUploadingAvatar = false;
  let avatarError: string | null = null;
  let avatarSuccess: string | null = null;

  $: profile = $profileStore.profile;

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) {
      passwordError = 'Passwords do not match';
      return;
    }

    try {
      isChangingPassword = true;
      passwordError = null;
      // TODO: Implement password change
      passwordSuccess = 'Password updated successfully';
    } catch (e) {
      passwordError = (e as Error).message;
    } finally {
      isChangingPassword = false;
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    }
  }

  async function handleAvatarUpload() {
    if (!avatarFile?.[0]) return;

    try {
      isUploadingAvatar = true;
      avatarError = null;
      
      // TODO: Implement avatar upload
      // 1. Upload to Firebase Storage
      // 2. Get download URL
      // 3. Update profile with new avatar URL
      
      avatarSuccess = 'Avatar updated successfully';
    } catch (e) {
      avatarError = (e as Error).message;
    } finally {
      isUploadingAvatar = false;
      avatarFile = null;
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Implement account deletion
      // 1. Delete user data from database
      // 2. Delete Firebase auth account
      await authStore.logout();
    } catch (e) {
      console.error('Failed to delete account:', e);
    }
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <h1 class="text-3xl font-bold mb-8">Profile Settings</h1>

  <div class="space-y-8">
    <!-- Avatar Section -->
    <div class="bg-base-100 rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Profile Picture</h2>
      
      <div class="flex items-center gap-6">
        <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
          {#if profile?.photoURL}
            <img src={profile.photoURL} alt="Profile" class="w-full h-full object-cover" />
          {:else}
            <div class="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          {/if}
        </div>

        <div class="flex-1">
          <input
            type="file"
            accept="image/*"
            bind:files={avatarFile}
            class="mb-2"
          />
          <button
            class="btn btn-primary"
            on:click={handleAvatarUpload}
            disabled={!avatarFile || isUploadingAvatar}
          >
            {isUploadingAvatar ? 'Uploading...' : 'Upload New Picture'}
          </button>

          {#if avatarError}
            <p class="form-error">{avatarError}</p>
          {/if}
          {#if avatarSuccess}
            <p class="form-success">{avatarSuccess}</p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Password Section -->
    <div class="bg-base-100 rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Change Password</h2>

      <form on:submit|preventDefault={handlePasswordChange} class="space-y-4">
        <div>
          <label for="currentPassword" class="block text-sm font-medium mb-2">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            bind:value={currentPassword}
            class="input"
            required
          />
        </div>

        <div>
          <label for="newPassword" class="block text-sm font-medium mb-2">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            bind:value={newPassword}
            class="input"
            required
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            bind:value={confirmPassword}
            class="input"
            required
          />
        </div>

        {#if passwordError}
          <p class="form-error">{passwordError}</p>
        {/if}
        {#if passwordSuccess}
          <p class="form-success">{passwordSuccess}</p>
        {/if}

        <button
          type="submit"
          class="btn btn-primary"
          disabled={isChangingPassword}
        >
          {isChangingPassword ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>

    <!-- Danger Zone -->
    <div class="bg-red-50 rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold text-red-700 mb-4">Danger Zone</h2>
      
      <div>
        <p class="text-red-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        
        <button
          class="btn bg-red-600 hover:bg-red-700 text-white"
          on:click={handleDeleteAccount}
        >
          Delete Account
        </button>
      </div>
    </div>
  </div>
</div>