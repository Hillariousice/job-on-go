<template>
  <div class="flex items-center justify-center min-h-screen bg-purple-50 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 p-8 sm:p-10 bg-white shadow-xl rounded-xl">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-purple-700">
          Forgot Your Password?
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your email address below and we'll send you a link to reset your password.
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleForgotPassword">
        <div>
          <label for="email-address" class="sr-only">Email address</label>
          <input
            id="email-address"
            name="email"
            type="email"
            v-model="email"
            autocomplete="email"
            required
            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>

        <div v-if="message" class="p-3 bg-green-50 border-l-4 border-green-400">
          <p class="text-sm text-green-700">{{ message }}</p>
        </div>
        <div v-if="errorMessage" class="p-3 bg-red-50 border-l-4 border-red-400">
          <p class="text-sm text-red-700">{{ errorMessage }}</p>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <!-- Simple spinner -->
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span v-if="isLoading">Sending...</span>
            <span v-else>Send Password Reset Link</span>
          </button>
        </div>
      </form>
      <div class="text-sm text-center">
        <RouterLink to="/login" class="font-medium text-purple-600 hover:text-purple-500">
          Back to Login
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { RouterLink } from 'vue-router';

const email = ref('');
const message = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const auth = getAuth();

const handleForgotPassword = async () => {
  isLoading.value = true;
  message.value = '';
  errorMessage.value = '';

  if (!email.value) {
    errorMessage.value = 'Please enter your email address.';
    isLoading.value = false;
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email.value);
    message.value = 'Password reset email sent successfully! Please check your inbox (and spam folder).';
    email.value = ''; // Clear the input field
  } catch (error: any) {
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage.value = 'No user found with this email address.';
        break;
      case 'auth/invalid-email':
        errorMessage.value = 'The email address is not valid.';
        break;
      case 'auth/network-request-failed':
        errorMessage.value = 'Network error. Please check your internet connection.';
        break;
      default:
        errorMessage.value = 'An unexpected error occurred. Please try again.';
        console.error('Password reset error:', error);
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Add any additional scoped styles if needed */
</style>
