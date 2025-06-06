<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { db, auth } from '@/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp, // For type checking applicationDate if it's a Firestore Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth'; // Type-only import

interface AppliedJobDisplay {
  jobId: string;
  jobTitle: string;
  companyName: string;
  location: string;
  applicationDate: Date;
  status: string;
  // Optional: add application ID if needed for future linking
  // applicationId: string;
}

const appliedJobs = ref<AppliedJobDisplay[]>([]);
const isLoading = ref(true);
const currentUser = ref<User | null>(null);
const hasAttemptedFetch = ref(false);


onAuthStateChanged(auth, (user) => {
  currentUser.value = user;
  if (user) {
    fetchAppliedJobs();
  } else {
    // Handle logged out state: clear jobs, stop loading.
    appliedJobs.value = [];
    isLoading.value = false;
    hasAttemptedFetch.value = true; // Mark that an attempt was made or user state determined
  }
});

const fetchAppliedJobs = async () => {
  if (!currentUser.value) {
    isLoading.value = false;
    hasAttemptedFetch.value = true;
    return;
  }

  isLoading.value = true;
  hasAttemptedFetch.value = true;
  const localAppliedJobs: AppliedJobDisplay[] = [];

  try {
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('applicantId', '==', currentUser.value.uid)
    );
    const querySnapshot = await getDocs(applicationsQuery);

    for (const appDoc of querySnapshot.docs) {
      const appData = appDoc.data();
      const jobId = appData.jobId;

      if (jobId) {
        const jobDocRef = doc(db, 'jobs', jobId);
        const jobDocSnap = await getDoc(jobDocRef);

        if (jobDocSnap.exists()) {
          const jobData = jobDocSnap.data();
          let appDate: Date;
          if (appData.applicationDate instanceof Timestamp) {
            appDate = appData.applicationDate.toDate();
          } else if (typeof appData.applicationDate === 'string') {
            appDate = new Date(appData.applicationDate);
          } else {
            appDate = new Date(); // Fallback, should ideally not happen
          }

          localAppliedJobs.push({
            jobId: jobId,
            jobTitle: jobData.title || 'N/A',
            companyName: jobData.company?.name || 'N/A',
            location: jobData.location || 'N/A',
            applicationDate: appDate,
            status: appData.status || 'Pending',
            // applicationId: appDoc.id,
          });
        } else {
          console.warn(`Job with ID ${jobId} not found for application ${appDoc.id}`);
        }
      } else {
        console.warn(`Application ${appDoc.id} is missing a jobId.`);
      }
    }
    // Sort by application date, newest first
    appliedJobs.value = localAppliedJobs.sort((a, b) => b.applicationDate.getTime() - a.applicationDate.getTime());
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    // Optionally set an error state to show in UI
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (date: Date | undefined) => {
  if (!date) return 'N/A';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const getStatusClass = (status: string) => {
  status = status.toLowerCase(); // Ensure case-insensitivity
  switch (status) {
    case 'applied': // Was 'pending'
      return 'bg-yellow-100 text-yellow-800';
    case 'under-review':
      return 'bg-teal-100 text-teal-800';
    case 'interviewing': // Was 'shortlisted' - or similar
      return 'bg-blue-100 text-blue-800';
    case 'offer-extended':
      return 'bg-purple-100 text-purple-800';
    case 'offer-accepted': // Was 'hired'
      return 'bg-green-100 text-green-800';
    case 'offer-declined':
      return 'bg-orange-100 text-orange-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'withdrawn':
      return 'bg-gray-200 text-gray-700'; // Slightly different gray for distinction
    default:
      return 'bg-gray-100 text-gray-800'; // Default for any unknown status
  }
};
</script>

<template>
  <div class="bg-white shadow-md rounded-lg p-4 sm:p-6 mt-6">
    <h2 class="text-xl sm:text-2xl font-bold text-purple-700 mb-6">My Applied Jobs</h2>
    <div v-if="isLoading" class="text-center py-8">
      <p class="text-gray-500">Loading your applications...</p>
      <!-- Optional: Add a spinner here -->
    </div>
    <div v-else-if="!currentUser && hasAttemptedFetch" class="text-center py-8">
      <p class="text-gray-600">Please <router-link to="/login" class="text-purple-600 hover:underline">log in</router-link> to see your applied jobs.</p>
    </div>
    <div v-else-if="appliedJobs.length === 0 && hasAttemptedFetch" class="text-center py-8">
      <p class="text-gray-600">You have not applied for any jobs yet.</p>
      <router-link to="/jobs" class="mt-2 inline-block text-purple-600 hover:underline">
        Find Jobs
      </router-link>
    </div>
    <div v-else-if="appliedJobs.length > 0" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job Title
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Applied Date
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="job in appliedJobs" :key="job.jobId">
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
               <router-link :to="`/jobs/${job.jobId}`" class="text-purple-600 hover:text-purple-800 hover:underline">
                {{ job.jobTitle }}
              </router-link>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{{ job.companyName }}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ job.location }}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ formatDate(job.applicationDate) }}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
              <span
                :class="getStatusClass(job.status)"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ job.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
     <div v-else-if="!hasAttemptedFetch && !isLoading" class="text-center py-8">
        <p class="text-gray-500">Checking for applications...</p>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles if needed */
</style>
