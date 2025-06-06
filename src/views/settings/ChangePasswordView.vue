<script setup lang="ts">
import { ref } from 'vue';
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css'; // Optional: if you want to use a theme
import CustomBackButton from '@/components/custom/CustomBackButton.vue'; // Assuming a back button component

const toast = useToast();
const auth = getAuth();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const toggleShowCurrentPassword = () => {
  showCurrentPassword.value = !showCurrentPassword.value;
};
const toggleShowNewPassword = () => {
  showNewPassword.value = !showNewPassword.value;
};
const toggleShowConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

const handleChangePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    toast.error('New passwords do not match.');
    return;
  }
  if (newPassword.value.length < 6) {
    toast.error('New password must be at least 6 characters long.');
    return;
  }

  const user = auth.currentUser;
  if (!user || !user.email) { // user.email check is important for EmailAuthProvider
    toast.error('User not found or email not available. Please re-login.');
    return;
  }

  isLoading.value = true;
  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword.value);
    await reauthenticateWithCredential(user, credential);

    // If re-authentication is successful, update the password
    await updatePassword(user, newPassword.value);

    toast.success('Password updated successfully!');
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (error: any) {
    console.error('Error changing password:', error);
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      toast.error('Incorrect current password.');
    } else if (error.code === 'auth/weak-password') {
      toast.error('The new password is too weak.');
    }
    else {
      toast.error('Failed to change password. Please try again.');
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <section class="container mx-auto p-4 py-6">
    <CustomBackButton to="/settings" />
    <h1 class="text-3xl font-bold text-center mb-8 text-purple-700">Change Password</h1>

    <div class="bg-white p-6 sm:p-8 rounded-lg shadow-md max-w-lg mx-auto">
      <form @submit.prevent="handleChangePassword">
        <!-- Current Password -->
        <div class="mb-6 relative">
          <label for="currentPassword" class="block text-gray-700 font-bold mb-2">Current Password</label>
          <input
            :type="showCurrentPassword ? 'text' : 'password'"
            id="currentPassword"
            v-model="currentPassword"
            class="w-full p-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            required
          />
          <i
            :class="['pi', showCurrentPassword ? 'pi-eye-slash' : 'pi-eye', 'absolute right-3 top-[60%] transform -translate-y-1/2 cursor-pointer text-gray-500']"
            @click="toggleShowCurrentPassword"
            style="margin-top: 0.625rem;"
          ></i>
        </div>

        <!-- New Password -->
        <div class="mb-6 relative">
          <label for="newPassword" class="block text-gray-700 font-bold mb-2">New Password</label>
          <input
            :type="showNewPassword ? 'text' : 'password'"
            id="newPassword"
            v-model="newPassword"
            class="w-full p-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            required
          />
          <i
            :class="['pi', showNewPassword ? 'pi-eye-slash' : 'pi-eye', 'absolute right-3 top-[60%] transform -translate-y-1/2 cursor-pointer text-gray-500']"
            @click="toggleShowNewPassword"
            style="margin-top: 0.625rem;"
          ></i>
        </div>

        <!-- Confirm New Password -->
        <div class="mb-6 relative">
          <label for="confirmPassword" class="block text-gray-700 font-bold mb-2">Confirm New Password</label>
          <input
            :type="showConfirmPassword ? 'text' : 'password'"
            id="confirmPassword"
            v-model="confirmPassword"
           class="w-full p-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            required
          />
          <i
            :class="['pi', showConfirmPassword ? 'pi-eye-slash' : 'pi-eye', 'absolute right-3 top-[60%] transform -translate-y-1/2 cursor-pointer text-gray-500']"
            @click="toggleShowConfirmPassword"
            style="margin-top: 0.625rem;"
          ></i>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full w-full focus:outline-none focus:shadow-outline disabled:bg-purple-300 transition duration-150 ease-in-out"
          >
            <span v-if="isLoading">Changing...</span>
            <span v-else>Change Password</span>
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
