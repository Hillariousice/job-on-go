<template>
  <div class="flex items-center justify-center min-h-screen bg-purple-50 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 p-8 sm:p-10 bg-white shadow-xl rounded-xl">

      <!-- Loading/Verifying Code State -->
      <div v-if="isLoading" class="text-center">
        <h2 class="text-2xl font-semibold text-purple-700 mb-4">Verifying Reset Link...</h2>
        <p class="text-gray-600">Please wait while we check your password reset link.</p>
        <!-- Simple spinner -->
        <svg class="animate-spin h-8 w-8 text-purple-600 mx-auto mt-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Invalid Code State or No Code -->
      <div v-else-if="!isCodeValid || !actionCode" class="text-center">
        <h2 class="text-2xl font-semibold text-red-600 mb-4">Link Error</h2>
        <p class="text-gray-600 mb-6">
          {{ errorMessage || "The password reset link is invalid, expired, or was not provided. Please request a new one." }}
        </p>
        <RouterLink
          to="/forgot-password"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Request New Reset Link
        </RouterLink>
         <div class="mt-4 text-sm">
          <RouterLink to="/login" class="font-medium text-purple-600 hover:text-purple-500">
            Back to Login
          </RouterLink>
        </div>
      </div>

      <!-- Valid Code State (Password Form) -->
      <div v-else>
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-purple-700">
            Reset Your Password
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Enter your new password below. Make sure it's strong and memorable.
          </p>
        </div>
        <form class="mt-8 space-y-6" @submit.prevent="handleResetPassword">
          <div>
            <label for="new-password" class="sr-only">New Password</label>
            <input
              id="new-password"
              name="newPassword"
              type="password"
              v-model="newPassword"
              required
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm mb-3"
              placeholder="New Password"
            />
          </div>
          <div>
            <label for="confirm-password" class="sr-only">Confirm New Password</label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              v-model="confirmPassword"
              required
              class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Confirm New Password"
            />
          </div>

          <div v-if="message" class="p-3 bg-green-50 border-l-4 border-green-400">
            <p class="text-sm text-green-700">{{ message }}</p>
          </div>
          <div v-if="errorMessage && !isLoading" class="p-3 bg-red-50 border-l-4 border-red-400">
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <span v-if="isSubmitting" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <span v-if="isSubmitting">Resetting...</span>
              <span v-else>Reset Password</span>
            </button>
          </div>
        </form>
         <div v-if="!message" class="mt-4 text-sm text-center"> <!-- Hide back to login if success message shown -->
          <RouterLink to="/login" class="font-medium text-purple-600 hover:text-purple-500">
            Back to Login
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';

const auth = getAuth();
const route = useRoute();
const router = useRouter();

const actionCode = ref<string | null>(null);
const isCodeValid = ref(false);
const isLoading = ref(true); // For initial code verification
const isSubmitting = ref(false); // For password submission form

const newPassword = ref('');
const confirmPassword = ref('');
const message = ref('');
const errorMessage = ref('');

onMounted(async () => {
  const oobCode = route.query.oobCode;

  if (typeof oobCode === 'string' && oobCode) {
    actionCode.value = oobCode;
    try {
      await verifyPasswordResetCode(auth, actionCode.value);
      isCodeValid.value = true;
      message.value = 'Verification successful. Please enter your new password.'; // Optional: provide feedback
    } catch (error: any) {
      console.error('Error verifying password reset code:', error);
      switch (error.code) {
        case 'auth/expired-action-code':
          errorMessage.value = 'The password reset link has expired. Please request a new one.';
          break;
        case 'auth/invalid-action-code':
          errorMessage.value = 'The password reset link is invalid. It may have already been used or malformed.';
          break;
        case 'auth/user-disabled':
          errorMessage.value = 'This account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage.value = 'There is no user corresponding to this password reset link.';
          break;
        default:
          errorMessage.value = 'Invalid or expired password reset link. Please try again.';
      }
      isCodeValid.value = false;
    }
  } else {
    errorMessage.value = 'Password reset code not found in link. Please ensure you are using the correct link.';
    isCodeValid.value = false;
    actionCode.value = null; // Ensure actionCode is null if no oobCode
  }
  isLoading.value = false;
});

const handleResetPassword = async () => {
  message.value = '';
  errorMessage.value = '';

  if (!newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Please enter and confirm your new password.';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }
  if (newPassword.value.length < 6) {
    errorMessage.value = 'Password should be at least 6 characters long.';
    return;
  }
  if (!actionCode.value) { // Should not happen if form is shown, but good check
    errorMessage.value = 'No valid reset action code available. Please restart the process.';
    isCodeValid.value = false; // Force UI back to invalid state
    return;
  }

  isSubmitting.value = true;
  try {
    await confirmPasswordReset(auth, actionCode.value, newPassword.value);
    message.value = 'Password has been reset successfully! Redirecting to login...';
    newPassword.value = '';
    confirmPassword.value = '';
    setTimeout(() => {
      router.push('/login');
    }, 3000); // Delay for user to read message
  } catch (error: any) {
    console.error('Error resetting password:', error);
     switch (error.code) {
        case 'auth/expired-action-code':
          errorMessage.value = 'The password reset link has expired. Please request a new one.';
          isCodeValid.value = false; // Mark code as invalid for UI update
          break;
        case 'auth/invalid-action-code':
          errorMessage.value = 'The password reset link is invalid. It may have already been used or malformed.';
          isCodeValid.value = false;
          break;
        case 'auth/user-disabled':
          errorMessage.value = 'This account has been disabled.';
          isCodeValid.value = false;
          break;
        case 'auth/user-not-found': // Should ideally not happen if verify was successful, but possible in race conditions
          errorMessage.value = 'There is no user corresponding to this password reset link.';
          isCodeValid.value = false;
          break;
        case 'auth/weak-password':
          errorMessage.value = 'The new password is too weak. Please choose a stronger password.';
          break;
        default:
          errorMessage.value = 'Error resetting password. The link may have expired or the password is too weak.';
      }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
/* Add any additional scoped styles if needed */
</style>
