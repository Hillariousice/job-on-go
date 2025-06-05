<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  getAuth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';
import router from '@/router'; // Import router for navigation
import CustomBackButton from '@/components/custom/CustomBackButton.vue';

const accountType = ref('');
const isLoadingAccountType = ref(true);
const showDeleteConfirmationModal = ref(false);
const deleteConfirmPassword = ref('');
const isDeleting = ref(false);
const isSwitchingAccount = ref(false); // New loading state for account switch

const toast = useToast();
const auth = getAuth();

const fetchAccountType = async () => {
  isLoadingAccountType.value = true;
  try {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists() && userDocSnap.data().accountType) {
        accountType.value = userDocSnap.data().accountType;
      } else {
        const companyDocRef = doc(db, 'company', auth.currentUser.uid);
        const companyDocSnap = await getDoc(companyDocRef);

        if (companyDocSnap.exists() && companyDocSnap.data().accountType) {
          accountType.value = companyDocSnap.data().accountType;
        } else {
          accountType.value = 'Unknown';
          console.warn('Account type not found for user:', auth.currentUser.uid);
        }
      }
    } catch (error) {
      console.error("Error fetching account type:", error);
      accountType.value = 'Error loading type';
    }
  } else {
    accountType.value = 'Not authenticated';
    console.warn('User not authenticated when fetching account type.');
  }
  isLoadingAccountType.value = false;
};

onMounted(() => {
  if (auth.currentUser) { // Check current user directly from auth
    fetchAccountType();
  } else {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe(); // Unsubscribe after first call
      if (user) {
        fetchAccountType();
      } else {
        isLoadingAccountType.value = false;
        accountType.value = 'Not authenticated';
      }
    });
  }
});

const initiateAccountSwitch = async () => {
  const user = auth.currentUser;
  if (!user) {
    toast.error("You must be logged in to switch account types.");
    return;
  }

  const newAccountType = accountType.value === 'developer' ? 'company' : 'developer';
  const confirmationMessage = `You are about to switch your account to a ${newAccountType} profile. Some of your current profile information might not be relevant for the new account type and may need to be updated on your profile page. Are you sure you want to proceed?`;

  if (window.confirm(confirmationMessage)) {
    isSwitchingAccount.value = true;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      let currentData = {};
      if (userDocSnap.exists()) {
        currentData = userDocSnap.data();
      }

      let updatedData: any = {
        ...currentData,
        accountType: newAccountType,
        updated_at: serverTimestamp(),
      };

      let newAuthDisplayName = user.displayName || '';

      if (newAccountType === 'company') {
        // Switching from Developer to Company
        updatedData.companyName = (currentData as any).companyName || user.displayName || `${(currentData as any).firstName || ''} ${(currentData as any).lastName || ''}`.trim() || 'New Company';
        newAuthDisplayName = updatedData.companyName;
        // Clear developer-specific fields (optional, or set to null/empty)
        updatedData.skills = '';
        // Keep firstName/lastName as potential contact person if desired, or clear them:
        // updatedData.firstName = '';
        // updatedData.lastName = '';
      } else {
        // Switching from Company to Developer
        const firstName = (currentData as any).firstName || '';
        const lastName = (currentData as any).lastName || '';
        if (firstName && lastName) {
          newAuthDisplayName = `${firstName} ${lastName}`;
        } else if (firstName) {
          newAuthDisplayName = firstName;
        } else {
          newAuthDisplayName = user.email || 'New User'; // Fallback for displayName
        }
        updatedData.displayName = newAuthDisplayName; // Ensure this is set for developer
        // Clear company-specific fields (optional, or set to null/empty)
        updatedData.companyName = '';
        updatedData.companyWebsite = '';
        updatedData.companyDescription = '';
      }

      await setDoc(userDocRef, updatedData, { merge: true });

      // Update Firebase Auth display name
      if (user.displayName !== newAuthDisplayName) {
        await updateProfile(user, { displayName: newAuthDisplayName });
      }

      accountType.value = newAccountType; // Update local state
      toast.success(`Account type switched to ${newAccountType}. Please review your profile details.`);
      router.push('/profile');

    } catch (error: any) {
      console.error("Error switching account type:", error);
      toast.error("Failed to switch account type: " + error.message);
    } finally {
      isSwitchingAccount.value = false;
    }
  }
};

const handleConfirmDelete = async () => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    toast.error('User not available or email missing. Please re-login.');
    showDeleteConfirmationModal.value = false;
    return;
  }

  if (!deleteConfirmPassword.value) {
    toast.error('Password is required to delete your account.');
    return;
  }

  isDeleting.value = true;
  try {
    // 1. Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, deleteConfirmPassword.value);
    await reauthenticateWithCredential(user, credential);

    // 2. Delete user's jobs from Firestore
    const jobsQuery = query(collection(db, 'jobs'), where('userId', '==', user.uid));
    const jobsSnapshot = await getDocs(jobsQuery);
    if (!jobsSnapshot.empty) {
      const batch = writeBatch(db);
      jobsSnapshot.docs.forEach(jobDoc => {
        batch.delete(jobDoc.ref);
      });
      await batch.commit();
      toast.info('User jobs deleted.');
    }

    // 3. Delete user's document from 'users' and 'company' collections
    const userDocRef = doc(db, 'users', user.uid);
    await deleteDoc(userDocRef).catch(e => console.warn("No user doc to delete or error:", e));

    const companyDocRef = doc(db, 'company', user.uid);
    await deleteDoc(companyDocRef).catch(e => console.warn("No company doc to delete or error:", e));
    toast.info('User data deleted from Firestore.');

    // 4. Delete user from Firebase Auth
    await deleteUser(user);

    toast.success('Account deleted successfully.');
    showDeleteConfirmationModal.value = false;
    deleteConfirmPassword.value = ''; // Clear password
    router.push('/'); // Redirect to home or login page

  } catch (error: any) {
    console.error('Error deleting account:', error);
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      toast.error('Incorrect password. Account not deleted.');
    } else if (error.code === 'auth/requires-recent-login') {
      toast.error('This operation is sensitive and requires recent authentication. Please log in again and retry.');
    }
    else {
      toast.error('Failed to delete account. Please try again.');
    }
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <CustomBackButton to="/settings" />
  <section class="container mx-auto p-4 py-6">
    <h1 class="text-3xl font-bold text-center mb-8 text-purple-700">Manage Account</h1>

    <div class="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
      <!-- Account Type Display -->
      <div class="mb-8">
        <h3 class="text-xl font-semibold text-gray-800 mb-2">Account Type</h3>
        <div
          v-if="isLoadingAccountType" class="animate-pulse bg-gray-200 h-6 w-32 rounded-md">
          <!-- Loading state for account type fetching -->
        </div>
        <p v-else class="text-lg text-purple-700 font-medium capitalize">
          {{ accountType || 'Not specified' }}
        </p>
      </div>

      <!-- Switch Account Type -->
      <div class="mb-8 border-t border-gray-200 pt-6">
        <h3 class="text-xl font-semibold text-gray-800">Switch Account Type</h3>
        <div v-if="isLoadingAccountType" class="text-gray-500 mt-2">Loading account details...</div>
        <div v-else-if="accountType && accountType !== 'Unknown' && accountType !== 'Error loading type' && accountType !== 'Not authenticated'">
          <p class="text-gray-600 mt-3 mb-3 text-sm">
            You are currently a <span class="font-semibold text-purple-700">{{ accountType === 'developer' ? 'Developer' : 'Company' }}</span>.
          </p>
          <button
            @click="initiateAccountSwitch"
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
            :disabled="isDeleting || isSwitchingAccount"
          >
            <span v-if="isSwitchingAccount">Switching...</span>
            <span v-else>Switch to {{ accountType === 'developer' ? 'Company' : 'Developer' }} Account</span>
          </button>
        </div>
        <p v-else-if="accountType === 'Unknown' || accountType === 'Error loading type' || accountType === 'Not authenticated'" class="text-gray-500 mt-2 text-sm">
          Account type is currently {{ accountType.toLowerCase() }}. Switching is unavailable.
        </p>
        <p v-else class="text-gray-500 mt-3 text-sm">
          Functionality to switch account type is coming soon.
        </p>
      </div>

      <!-- Delete Account -->
      <div class="border-t border-gray-200 pt-6">
        <h3 class="text-xl font-semibold text-red-600">Delete Account</h3>
        <p class="text-gray-600 mt-3 text-sm">
          Please be careful. Deleting your account is permanent and will remove all your data, including profile information and job postings.
          This action cannot be undone.
        </p>
        <button
          @click="showDeleteConfirmationModal = true"
          class="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-150"
          :disabled="isDeleting"
        >
          Delete My Account
        </button>
      </div>
    </div>

    <!-- Delete Account Confirmation Modal -->
    <div v-if="showDeleteConfirmationModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 class="text-2xl font-bold mb-4 text-red-700">Confirm Account Deletion</h3>
        <p class="text-gray-700 mb-2">
          This action is irreversible. To proceed, please enter your password.
        </p>

        <div class="mt-4">
          <label for="deleteConfirmPassword" class="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="deleteConfirmPassword"
            v-model="deleteConfirmPassword"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            placeholder="Enter your password"
          >
        </div>

        <p class="text-xs text-gray-500 mt-4 mb-6">
          All your data, including your profile and any jobs you've posted, will be permanently deleted.
        </p>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            @click="showDeleteConfirmationModal = false"
            :disabled="isDeleting"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-150 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="handleConfirmDelete"
            :disabled="isDeleting"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-150 disabled:bg-red-300"
          >
            <span v-if="isDeleting">Deleting...</span>
            <span v-else>Yes, Delete My Account</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
