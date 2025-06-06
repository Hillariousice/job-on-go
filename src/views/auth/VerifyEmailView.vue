<template>
  <div class="flex items-center justify-center min-h-screen bg-purple-50 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-6 p-8 sm:p-10 bg-white shadow-xl rounded-xl">
      <div v-if="currentUser">
        <h2 class="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-purple-700">
          Verify Your Email Address
        </h2>

        <div v-if="isEmailVerified" class="mt-6 text-center">
          <p class="text-green-600 text-lg mb-4">Your email address has been successfully verified!</p>
          <p class="text-gray-700 mb-6">You can now access all features of your account.</p>
          <RouterLink
            to="/dashboard"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Go to Dashboard
          </RouterLink>
        </div>

        <div v-else class="mt-6 text-center">
          <p class="text-gray-700 mb-2">
            A verification email has been sent to:
            <strong class="text-purple-600">{{ currentUser.email }}</strong>.
          </p>
          <p class="text-gray-600 mb-4">
            Please check your inbox (and spam folder) and click the link to complete your registration.
          </p>

          <div v-if="message" class="p-3 my-4 bg-green-50 border-l-4 border-green-400">
            <p class="text-sm text-green-700">{{ message }}</p>
          </div>
          <div v-if="errorMessage" class="p-3 my-4 bg-red-50 border-l-4 border-red-400">
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
          </div>

          <p class="text-gray-600 my-6">
            If you didn't receive the email or it has expired, you can resend it.
          </p>
          <button
            @click="handleResendVerificationEmail"
            :disabled="isSending"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <span v-if="isSending" class="absolute left-0 inset-y-0 flex items-center pl-3">
               <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span v-if="isSending">Sending...</span>
            <span v-else>Resend Verification Email</span>
          </button>
        </div>

        <div class="mt-8 text-center">
          <button
            @click="handleLogout"
            class="text-sm text-gray-600 hover:text-purple-700 hover:underline focus:outline-none"
          >
            Log Out
          </button>
           <span class="mx-2 text-gray-400">|</span>
           <RouterLink to="/login" class="text-sm text-purple-600 hover:text-purple-500 hover:underline">
            Go to Login
          </RouterLink>
        </div>

      </div>
      <div v-else class="text-center">
        <p class="text-gray-600">Loading user information...</p>
         <!-- Simple spinner -->
        <svg class="animate-spin h-8 w-8 text-purple-600 mx-auto mt-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'; // Changed onMounted to watch
import { getAuth, onAuthStateChanged, sendEmailVerification, signOut, type User } from 'firebase/auth';
import { useRouter, RouterLink } from 'vue-router';

const auth = getAuth();
const router = useRouter();

const currentUser = ref<User | null>(null);
const isSending = ref(false);
const message = ref('');
const errorMessage = ref('');

// Check auth state and redirect if not logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser.value = user;
  } else {
    currentUser.value = null; // Ensure currentUser is null if no user
    router.push('/login');
  }
});

const isEmailVerified = computed(() => currentUser.value?.emailVerified === true);

// Watch for currentUser to become available, then for emailVerified changes
// This is to handle cases where the user verifies email in another tab
// and comes back to this page.
watch(currentUser, (user) => {
  if (user) {
    // Firebase's onAuthStateChanged often provides the latest user state.
    // Forcing a reload of the user state can sometimes get a fresher emailVerified status.
    user.reload().then(() => {
      // Update currentUser with the reloaded user object to trigger computed property updates
      // This is a bit of a workaround; ideally, Firebase's user object would auto-update everywhere.
      // Forcing a re-assignment if the object reference doesn't change by itself.
      currentUser.value = { ...user };
    }).catch(err => {
      console.error("Error reloading user state:", err);
    });
  }
}, { immediate: true });


const handleResendVerificationEmail = async () => {
  if (!currentUser.value || currentUser.value.emailVerified) {
    errorMessage.value = 'Your email is already verified or no user is logged in.';
    return;
  }

  isSending.value = true;
  message.value = '';
  errorMessage.value = '';

  try {
    await sendEmailVerification(currentUser.value);
    message.value = 'Verification email sent successfully! Please check your inbox.';
  } catch (error: any) {
    console.error('Error resending verification email:', error);
    if (error.code === 'auth/too-many-requests') {
      errorMessage.value = 'Too many requests. Please try again later.';
    } else {
      errorMessage.value = 'Error sending verification email. Please try again.';
    }
  } finally {
    isSending.value = false;
  }
};

const handleLogout = async () => {
  try {
    await signOut(auth);
    router.push('/login');
  } catch (error) {
    console.error('Error logging out:', error);
    errorMessage.value = 'Failed to log out. Please try again.';
  }
};
</script>

<style scoped>
/* Add any additional scoped styles if needed */
</style>
