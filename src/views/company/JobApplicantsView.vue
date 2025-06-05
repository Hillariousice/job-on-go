<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db, auth } from '@/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  DocumentData,
} from 'firebase/firestore';
import { useToast } from 'vue-toast-notification';
import BackButton from '@/components/custom/CustomBackButton.vue';
import { onAuthStateChanged, User } from 'firebase/auth';

interface Applicant {
  id: string; // Application document ID
  jobId: string;
  applicantId: string; // User UID
  applicationDate: Date;
  status: string;
  applicantName?: string;
  applicantEmail?: string;
}

interface JobDetails {
  title: string;
  userId: string; // UID of the job owner
}

const route = useRoute();
const router = useRouter();
const toast = useToast();

const jobId = route.params.jobId as string;
const jobDetails = ref<JobDetails | null>(null);
const applicants = ref<Applicant[]>([]);
const isLoading = ref(true);
const currentUser = ref<User | null>(null);

onAuthStateChanged(auth, (user) => {
  currentUser.value = user;
  if (user) {
    // Once user state is known, proceed with data fetching
    initializeView();
  } else {
    toast.error('You must be logged in to view this page.');
    router.push('/login');
  }
});

const initializeView = async () => {
  isLoading.value = true;
  await fetchJobDetails();
  if (jobDetails.value && currentUser.value && jobDetails.value.userId === currentUser.value.uid) {
    await fetchApplicants();
  } else if (jobDetails.value) { // Job details fetched but user is not owner
    toast.error('You are not authorized to view applicants for this job.');
    router.push(`/jobs/${jobId}`); // Redirect to job view page
  } else {
    // fetchJobDetails would have already handled errors if jobDetails is null
    // If it's null due to an error, appropriate toast/redirect would have occurred in fetchJobDetails
  }
  isLoading.value = false;
};

const fetchJobDetails = async () => {
  try {
    const jobDocRef = doc(db, 'jobs', jobId);
    const jobDocSnap = await getDoc(jobDocRef);
    if (jobDocSnap.exists()) {
      jobDetails.value = jobDocSnap.data() as JobDetails;
    } else {
      toast.error('Job not found.');
      router.push('/jobs');
    }
  } catch (error) {
    console.error('Error fetching job details:', error);
    toast.error('Failed to fetch job details.');
    router.push('/jobs');
  }
};

const fetchApplicants = async () => {
  try {
    const q = query(collection(db, 'applications'), where('jobId', '==', jobId));
    const querySnapshot = await getDocs(q);
    const fetchedApplicants: Applicant[] = [];

    for (const appDoc of querySnapshot.docs) {
      const appData = appDoc.data() as DocumentData;
      let applicantName = 'N/A';
      let applicantEmail = 'N/A';

      // Fetch user details
      if (appData.applicantId) {
        try {
          const userDocRef = doc(db, 'users', appData.applicantId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            applicantName = userData?.displayName || 'Name not set';
            applicantEmail = userData?.email || 'Email not set';
          }
        } catch (userError) {
          console.warn(`Could not fetch details for applicant ${appData.applicantId}:`, userError);
        }
      }

      fetchedApplicants.push({
        id: appDoc.id,
        jobId: appData.jobId,
        applicantId: appData.applicantId,
        applicationDate: (appData.applicationDate?.toDate ? appData.applicationDate.toDate() : new Date(appData.applicationDate)) || new Date(),
        status: appData.status || 'Pending',
        applicantName,
        applicantEmail,
      });
    }
    applicants.value = fetchedApplicants;
  } catch (error) {
    console.error('Error fetching applicants:', error);
    toast.error('Failed to fetch applicants.');
  }
};

const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
  try {
    const applicationDocRef = doc(db, 'applications', applicationId);
    await updateDoc(applicationDocRef, { status: newStatus });

    // Update local data
    const index = applicants.value.findIndex(app => app.id === applicationId);
    if (index !== -1) {
      applicants.value[index].status = newStatus;
    }
    toast.success(`Application status updated to ${newStatus}.`);
  } catch (error) {
    console.error('Error updating application status:', error);
    toast.error('Failed to update status.');
  }
};

const formatDate = (date: Date | undefined) => {
  if (!date) return 'N/A';
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

</script>

<template>
  <div class="container mx-auto p-4 sm:p-6">
    <BackButton />
    <div v-if="isLoading" class="text-center py-10">
      <p>Loading applicants...</p>
      <!-- Add a spinner or loading animation if available -->
    </div>
    <div v-else-if="!jobDetails">
      <p class="text-center text-red-500">Job details could not be loaded.</p>
    </div>
    <div v-else-if="currentUser && jobDetails.userId !== currentUser.uid">
       <p class="text-center text-red-500">You are not authorized to view these applicants.</p>
    </div>
    <div v-else>
      <h1 class="text-2xl sm:text-3xl font-bold mb-6 text-purple-700">
        Applicants for "{{ jobDetails.title }}"
      </h1>
      <div v-if="applicants.length === 0" class="text-center text-gray-600 py-8">
        <p class="text-xl">No applicants for this job yet.</p>
      </div>
      <div v-else class="overflow-x-auto bg-white shadow-md rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applicant Name
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Application Date
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="applicant in applicants" :key="applicant.id">
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ applicant.applicantName }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ applicant.applicantEmail }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{{ formatDate(applicant.applicationDate) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm">
                <span
                  :class="{
                    'bg-yellow-100 text-yellow-800': applicant.status === 'pending',
                    'bg-green-100 text-green-800': applicant.status === 'shortlisted',
                    'bg-red-100 text-red-800': applicant.status === 'rejected',
                    'bg-blue-100 text-blue-800': applicant.status === 'hired' // Example of another status
                  }"
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                >
                  {{ applicant.status }}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                <button
                  @click="updateApplicationStatus(applicant.id, 'shortlisted')"
                  :disabled="applicant.status === 'shortlisted'"
                  class="text-purple-600 hover:text-purple-900 disabled:opacity-50 disabled:cursor-not-allowed mr-2 sm:mr-3 px-2 py-1 rounded hover:bg-purple-100 transition-colors"
                  title="Shortlist Applicant"
                >
                  Shortlist
                </button>
                <button
                  @click="updateApplicationStatus(applicant.id, 'rejected')"
                  :disabled="applicant.status === 'rejected'"
                  class="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded hover:bg-red-100 transition-colors"
                  title="Reject Applicant"
                >
                  Reject
                </button>
                <!-- Add more actions like "Mark as Hired" if needed -->
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles if needed */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
