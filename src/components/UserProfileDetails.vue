<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css'; // Optional: if you want to use a theme

const toast = useToast();
const auth = getAuth();
const currentUser = auth.currentUser;

const profileForm = reactive({
  firstName: '',
  lastName: '',
  displayName: '',
  email: '',
  phone: '',
});

const isLoading = ref(false); // For form submission state

const fetchUserDetails = async () => {
  if (currentUser) {
    profileForm.email = currentUser.email || '';
    profileForm.displayName = currentUser.displayName || '';

    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        profileForm.firstName = userData.firstName || '';
        profileForm.lastName = userData.lastName || '';
        profileForm.phone = userData.phone || '';

        // If displayName in Auth is empty but we have names in Firestore, construct it
        if (!profileForm.displayName && profileForm.firstName && profileForm.lastName) {
          profileForm.displayName = `${profileForm.firstName} ${profileForm.lastName}`;
        } else if (!profileForm.displayName && profileForm.firstName) {
          profileForm.displayName = profileForm.firstName;
        }

      } else {
        // User document doesn't exist, maybe first login via social auth or new signup
        // Initialize with what we have from Auth
        if (profileForm.displayName) {
            // Try to parse first/last name from displayName if not directly available
            const nameParts = profileForm.displayName.split(' ');
            if(nameParts.length > 1) {
                profileForm.firstName = nameParts.slice(0, -1).join(' ');
                profileForm.lastName = nameParts.slice(-1).join(' ');
            } else {
                profileForm.firstName = profileForm.displayName;
            }
        }
        console.log('No such user document in Firestore, form initialized from Auth.');
      }
    } catch (error) {
      console.error("Error fetching user details from Firestore:", error);
      toast.error("Could not fetch user details.");
    }
  } else {
    toast.error("Not authenticated. Please login.");
    // Optionally redirect to login
  }
};

const handleUpdateProfile = async () => {
  if (!currentUser) {
    toast.error('Not authenticated.');
    return;
  }

  isLoading.value = true;
  try {
    // 1. Update Firebase Auth profile
    await updateProfile(currentUser, {
      displayName: profileForm.displayName,
      // photoURL: "...", // If handling photoURL update
    });

    // 2. Update/Create Firestore 'users' document
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDataToSave = {
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      displayName: profileForm.displayName, // Store displayName for consistency
      email: profileForm.email, // Usually email is not updated here directly by user
      phone: profileForm.phone,
      updated_at: serverTimestamp(),
    };

    // Use setDoc with merge: true to create if not exists, or update if exists
    await setDoc(userDocRef, userDataToSave, { merge: true });

    toast.success('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error('Failed to update profile.');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchUserDetails();
});
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-semibold mb-6 text-purple-600">My Details</h2>
    <form @submit.prevent="handleUpdateProfile">
      <!-- Display Name -->
      <div class="mb-4">
        <label for="displayName" class="block text-gray-700 font-bold mb-2">Display Name</label>
        <input
          type="text"
          id="displayName"
          v-model="profileForm.displayName"
          class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <!-- First Name -->
      <div class="mb-4">
        <label for="firstName" class="block text-gray-700 font-bold mb-2">First Name</label>
        <input
          type="text"
          id="firstName"
          v-model="profileForm.firstName"
          class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <!-- Last Name -->
      <div class="mb-4">
        <label for="lastName" class="block text-gray-700 font-bold mb-2">Last Name</label>
        <input
          type="text"
          id="lastName"
          v-model="profileForm.lastName"
          class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <!-- Email -->
      <div class="mb-4">
        <label for="email" class="block text-gray-700 font-bold mb-2">Email</label>
        <input
          type="email"
          id="email"
          v-model="profileForm.email"
          class="border rounded w-full py-2 px-3 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          readonly
        />
      </div>

      <!-- Phone -->
      <div class="mb-4">
        <label for="phone" class="block text-gray-700 font-bold mb-2">Phone</label>
        <input
          type="tel"
          id="phone"
          v-model="profileForm.phone"
          class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <!-- Submit Button -->
      <div>
        <button
          type="submit"
          :disabled="isLoading"
          class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline disabled:bg-purple-300"
        >
          <span v-if="isLoading">Updating...</span>
          <span v-else>Update Profile</span>
        </button>
      </div>
    </form>
  </div>
</template>
