<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { getAuth, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useToast } from 'vue-toast-notification';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import 'vue-toast-notification/dist/theme-sugar.css'; // Optional: if you want to use a theme

const toast = useToast();
const auth = getAuth();
const currentUser = auth.currentUser;

const profileForm = reactive({
  firstName: '', // developer
  lastName: '',  // developer
  displayName: '', // common, but source might differ
  email: '', // common, readonly
  phone: '', // common
  skills: '', // developer (e.g., string of comma-separated skills)
  companyName: '', // company
  companyWebsite: '', // company
  companyDescription: '', // company
  accountType: '',
  photoURL: '', // For current photo URL
});

const isLoading = ref(false); // For form submission state
const selectedFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const fetchUserDetails = async () => {
  if (currentUser) {
    profileForm.email = currentUser.email || '';
    profileForm.photoURL = currentUser.photoURL || ''; // Get photoURL from Auth
    imagePreviewUrl.value = profileForm.photoURL; // Initialize preview

    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        profileForm.accountType = userData.accountType || 'developer';

        // Populate photoURL from Firestore if it exists there and Auth doesn't have it
        // (though typically Auth is the source of truth after initial set)
        if (!profileForm.photoURL && userData.photoURL) {
          profileForm.photoURL = userData.photoURL;
          imagePreviewUrl.value = userData.photoURL;
        }

        if (profileForm.accountType === 'developer') {
          profileForm.firstName = userData.firstName || '';
          profileForm.lastName = userData.lastName || '';
          profileForm.skills = userData.skills || '';
          profileForm.displayName = currentUser.displayName || userData.displayName || (profileForm.firstName && profileForm.lastName ? `${profileForm.firstName} ${profileForm.lastName}` : profileForm.firstName || '');
        } else if (profileForm.accountType === 'company') {
          profileForm.companyName = userData.companyName || '';
          profileForm.companyDescription = userData.companyDescription || '';
          profileForm.companyWebsite = userData.companyWebsite || '';
          profileForm.displayName = currentUser.displayName || userData.displayName || profileForm.companyName;
          profileForm.firstName = userData.firstName || '';
          profileForm.lastName = userData.lastName || '';
        }
        profileForm.phone = userData.phone || '';

      } else {
        // Initialize from Auth, default to developer.
        profileForm.displayName = currentUser.displayName || '';
        if (profileForm.displayName && !profileForm.firstName && !profileForm.lastName) {
            const nameParts = profileForm.displayName.split(' ');
            if(nameParts.length > 1) {
                profileForm.firstName = nameParts.slice(0, -1).join(' ');
                profileForm.lastName = nameParts.slice(-1).join(' ');
            } else {
                profileForm.firstName = profileForm.displayName;
            }
        }
        profileForm.accountType = 'developer'; // Default account type
        console.log('No user document in Firestore. Initializing from Auth, defaulting to developer.');
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
    // 1. Determine displayName for Auth update
    let authDisplayName = profileForm.displayName; // Default to what's in the form
    if (profileForm.accountType === 'developer' && profileForm.firstName && profileForm.lastName) {
      authDisplayName = `${profileForm.firstName} ${profileForm.lastName}`;
    } else if (profileForm.accountType === 'company' && profileForm.companyName) {
      authDisplayName = profileForm.companyName;
    }
    // Ensure profileForm.displayName is also updated if derived, for UI consistency
    profileForm.displayName = authDisplayName;

    // Upload new profile picture if one is selected
    let newPhotoURL = profileForm.photoURL; // Keep current photoURL by default
    if (selectedFile.value) {
      try {
        toast.info('Uploading profile picture...');
        const storage = getStorage();
        const fileToUploadRef = storageRef(storage, `profile_pictures/${currentUser.uid}/${selectedFile.value.name}`);
        const uploadTask = uploadBytesResumable(fileToUploadRef, selectedFile.value);

        await uploadTask;
        newPhotoURL = await getDownloadURL(uploadTask.snapshot.ref);

        profileForm.photoURL = newPhotoURL; // Update reactive form
        selectedFile.value = null; // Clear selected file
        imagePreviewUrl.value = newPhotoURL; // Update preview to uploaded image
        toast.success('Profile picture uploaded successfully!');
      } catch (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        toast.error('Failed to upload new profile picture. Other profile data will still be updated if changed.');
        // newPhotoURL remains the original profileForm.photoURL
      }
    }

    // Update Firebase Auth profile (displayName and potentially new photoURL)
    await updateProfile(currentUser, {
      displayName: authDisplayName,
      photoURL: newPhotoURL,
    });

    // 2. Prepare data for Firestore based on account type
    const userDocRef = doc(db, 'users', currentUser.uid);
    let userDataToSave: any = {
      email: profileForm.email,
      phone: profileForm.phone,
      accountType: profileForm.accountType,
      displayName: authDisplayName,
      photoURL: newPhotoURL, // Save the new or existing photoURL to Firestore
      updated_at: serverTimestamp(),
    };

    if (profileForm.accountType === 'developer') {
      userDataToSave = {
        ...userDataToSave,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        skills: profileForm.skills,
      };
    } else if (profileForm.accountType === 'company') {
      userDataToSave = {
        ...userDataToSave,
        companyName: profileForm.companyName,
        companyDescription: profileForm.companyDescription,
        companyWebsite: profileForm.companyWebsite,
        // Optionally save contact person details if form includes them for company
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
      };
    }

    await setDoc(userDocRef, userDataToSave, { merge: true });
    toast.success('Profile updated successfully!');
    // Re-fetch details to ensure form reflects any server-side transformations (e.g. timestamps)
    // or if displayName was auto-constructed and needs to be re-bound from Auth, or photoURL updated.
    await fetchUserDetails();
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

watch(() => profileForm.photoURL, (newUrl) => {
  if (!selectedFile.value) { // Only update preview from profileForm if no new file is selected
    imagePreviewUrl.value = newUrl;
  }
});

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileSelection = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    selectedFile.value = file;
    imagePreviewUrl.value = URL.createObjectURL(file);
  }
};
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-semibold mb-6 text-purple-600">My Details</h2>
    <form @submit.prevent="handleUpdateProfile">

      <!-- Profile Picture Display and Upload -->
      <div class="mb-6 text-center">
        <img
          :src="imagePreviewUrl || 'https://via.placeholder.com/128/CCCCCC/808080?Text=Avatar'"
          alt="Profile Picture"
          class="w-32 h-32 rounded-full object-cover mx-auto border-2 border-purple-300 shadow-sm mb-4"
        >
        <input
          type="file"
          accept="image/*"
          @change="handleFileSelection"
          ref="fileInputRef"
          class="hidden"
        >
        <button
          type="button"
          @click="triggerFileInput"
          class="text-sm text-purple-600 hover:text-purple-800 focus:outline-none py-1 px-3 border border-purple-300 hover:bg-purple-50 rounded-md"
        >
          Change Picture
        </button>
      </div>

      <!-- Account Type (Read-only) -->
      <div class="mb-4">
        <label for="accountType" class="block text-gray-700 font-bold mb-2">Account Type</label>
        <input
          type="text"
          id="accountType"
          v-model="profileForm.accountType"
          class="border rounded w-full py-2 px-3 bg-gray-100 focus:outline-none"
          readonly
        />
      </div>

      <!-- Display Name -->
      <div class="mb-4">
        <label for="displayName" class="block text-gray-700 font-bold mb-2">
          {{ profileForm.accountType === 'company' ? 'Company Display Name' : 'Display Name' }}
        </label>
        <input
          type="text"
          id="displayName"
          v-model="profileForm.displayName"
          class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
        <p v-if="profileForm.accountType === 'developer'" class="text-xs text-gray-500 mt-1">This will be updated from First and Last Name if those are provided.</p>
        <p v-if="profileForm.accountType === 'company'" class="text-xs text-gray-500 mt-1">This will be updated from Company Name if that is provided.</p>
      </div>

      <!-- Developer Specific Fields -->
      <template v-if="profileForm.accountType === 'developer'">
        <div class="mb-4">
          <label for="firstName" class="block text-gray-700 font-bold mb-2">First Name</label>
          <input type="text" id="firstName" v-model="profileForm.firstName" class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
        </div>
        <div class="mb-4">
          <label for="lastName" class="block text-gray-700 font-bold mb-2">Last Name</label>
          <input type="text" id="lastName" v-model="profileForm.lastName" class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
        </div>
        <div class="mb-4">
          <label for="skills" class="block text-gray-700 font-bold mb-2">Skills (comma-separated)</label>
          <textarea id="skills" v-model="profileForm.skills" class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" rows="3" placeholder="e.g., Vue.js, TypeScript, Tailwind CSS"></textarea>
        </div>
      </template>

      <!-- Company Specific Fields -->
      <template v-if="profileForm.accountType === 'company'">
        <div class="mb-4">
          <label for="companyName" class="block text-gray-700 font-bold mb-2">Company Name</label>
          <input type="text" id="companyName" v-model="profileForm.companyName" class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" required/>
        </div>
        <div class="mb-4">
          <label for="companyWebsite" class="block text-gray-700 font-bold mb-2">Company Website</label>
          <input type="url" id="companyWebsite" v-model="profileForm.companyWebsite" class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="https://example.com"/>
        </div>
        <div class="mb-4">
          <label for="companyDescription" class="block text-gray-700 font-bold mb-2">Company Description</label>
          <textarea id="companyDescription" v-model="profileForm.companyDescription" class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500" rows="3"></textarea>
        </div>
        <!-- Optional: Contact Person for Company -->
        <h3 class="text-lg font-semibold text-gray-700 mb-3 mt-6 border-t pt-4">Contact Person (Optional)</h3>
        <div class="mb-4">
          <label for="contactFirstName" class="block text-gray-700 font-bold mb-2">First Name</label>
          <input type="text" id="contactFirstName" v-model="profileForm.firstName" placeholder="Contact's first name" class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
        </div>
        <div class="mb-4">
          <label for="contactLastName" class="block text-gray-700 font-bold mb-2">Last Name</label>
          <input type="text" id="contactLastName" v-model="profileForm.lastName" placeholder="Contact's last name" class="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
        </div>
      </template>

      <!-- Common Fields -->
      <!-- Email (Read-only) -->
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

      <!-- Phone (Common) -->
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
