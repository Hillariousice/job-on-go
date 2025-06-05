<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UserProfileDetails from '@/components/UserProfileDetails.vue';
import UserPostedJobs from '@/components/UserPostedJobs.vue';
import DeveloperAppliedJobs from '@/components/DeveloperAppliedJobs.vue';
import CompanyApplicantsSummary from '@/components/CompanyApplicantsSummary.vue'; // Import CompanyApplicantsSummary
import { db, auth } from '@/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

const user = ref<User | null>(null);
const accountType = ref<string | null>(null);
const isLoadingProfile = ref(true);

const fetchUserAccountType = async (uid: string) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      accountType.value = userDocSnap.data()?.accountType || 'developer'; // Default to 'developer' if undefined
    } else {
      console.warn(`User document not found for UID: ${uid}. Defaulting to 'developer' account type.`);
      accountType.value = 'developer'; // Default if no user document
    }
  } catch (error) {
    console.error('Error fetching user account type:', error);
    accountType.value = 'developer'; // Default on error as well, or handle error state
  } finally {
    isLoadingProfile.value = false;
  }
};

onMounted(() => {
  onAuthStateChanged(auth, async (authUser) => {
    if (authUser) {
      user.value = authUser;
      await fetchUserAccountType(authUser.uid);
    } else {
      user.value = null;
      accountType.value = null;
      isLoadingProfile.value = false;
      // Optionally redirect to login if profile page strictly requires authentication
      // import router from '@/router'; router.push('/login');
    }
  });
});

</script>

<template>
  <section class="container mx-auto p-4 py-6">
    <h1 class="text-3xl font-bold text-center mb-8 text-purple-700">User Profile</h1>

    <div v-if="isLoadingProfile" class="text-center py-10">
      <p class="text-gray-500 text-xl">Loading profile...</p>
      <!-- Optional: Add a spinner component here -->
    </div>

    <div v-else-if="!user" class="text-center py-10">
       <p class="text-gray-600 text-xl">Please <router-link to="/login" class="text-purple-600 hover:underline">log in</router-link> to view your profile.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-1">
        <UserProfileDetails />
      </div>
      <div class="md:col-span-2 space-y-8"> {/* Added space-y-8 for consistent spacing between sections */}

        <!-- Section for Company Users: Posted Jobs -->
        <section v-if="accountType === 'company' || accountType === 'admin'">
          <h3 class="text-2xl font-semibold text-gray-800 mb-4">My Posted Jobs</h3>
          <UserPostedJobs />
        </section>

        <!-- Section for Company Users: Applicants Summary -->
        <section v-if="!isLoadingProfile && accountType === 'company'">
          <h3 class="text-2xl font-semibold text-gray-800 mb-4">Summary of Applicants</h3>
          <CompanyApplicantsSummary />
        </section>

        <!-- Section for Developer Users: Applied Jobs -->
        <section v-if="accountType === 'developer'">
          <h3 class="text-2xl font-semibold text-gray-800 mb-4">My Job Applications</h3>
          <DeveloperAppliedJobs />
        </section>

        <!-- Fallback message if accountType is null or not one of the above after loading -->
        <div v-if="!isLoadingProfile && accountType && accountType !=='company' && accountType !=='admin' && accountType !== 'developer'" class="mt-6 text-center text-gray-500">
          <p>No specific profile content to display for your account type. Your account type is: {{ accountType }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
