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
  // DocumentData will be imported as type-only
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from 'vue-toast-notification';
import BackButton from '@/components/custom/CustomBackButton.vue';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

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
const functions = getFunctions(); // Firebase Functions instance

// Modal and form state
const isModalOpen = ref(false);
const selectedApplicant = ref<Applicant | null>(null);
const newStatus = ref('');
const emailSubject = ref('');
const emailBody = ref('');
const availableStatuses = ref([
  'applied', 'under-review', 'interviewing',
  'offer-extended', 'offer-accepted', 'offer-declined',
  'rejected', 'withdrawn'
]);
const isSubmitting = ref(false); // For loading state on modal button

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

// const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
//   try {
//     const applicationDocRef = doc(db, 'applications', applicationId);
//     await updateDoc(applicationDocRef, { status: newStatus });

//     // Update local data
//     const index = applicants.value.findIndex(app => app.id === applicationId);
//     if (index !== -1) {
//       applicants.value[index].status = newStatus;
//     }
//     toast.success(`Application status updated to ${newStatus}.`);
//   } catch (error) {
//     console.error('Error updating application status:', error);
//     toast.error('Failed to update status.');
//   }
// };

const openContactModal = (applicant: Applicant) => {
  selectedApplicant.value = applicant;
  newStatus.value = applicant.status; // Pre-fill with current status
  emailSubject.value = `Update regarding your application for ${jobDetails.value?.title || 'the position'}`; // Pre-fill subject
  emailBody.value = `Dear ${applicant.applicantName || 'Applicant'},\n\nRegarding your application for the role of ${jobDetails.value?.title || 'our recent opening'}:\n\n[Your message here]\n\nSincerely,\nThe Hiring Team`; // Basic template
  isModalOpen.value = true;
};

const closeContactModal = () => {
  isModalOpen.value = false;
  selectedApplicant.value = null;
  newStatus.value = '';
  emailSubject.value = '';
  emailBody.value = '';
  isSubmitting.value = false;
};

const handleSendEmailAndUpdateStatus = async () => {
  if (!selectedApplicant.value || !newStatus.value || !emailSubject.value || !emailBody.value) {
    toast.error('Please fill in all fields: new status, subject, and email body.');
    return;
  }
  if (!selectedApplicant.value.id) {
    toast.error('Selected applicant ID is missing.');
    return;
  }

  isSubmitting.value = true;
  try {
    const contactAndUpdate = httpsCallable(functions, 'contactApplicantAndUpdateStatus');
    const result = await contactAndUpdate({
      applicationId: selectedApplicant.value.id,
      newStatus: newStatus.value,
      emailSubject: emailSubject.value,
      emailBody: emailBody.value,
    });

    if (result.data && (result.data as any).success) {
      // Update local data
      const index = applicants.value.findIndex(app => app.id === selectedApplicant.value!.id);
      if (index !== -1) {
        applicants.value[index].status = newStatus.value;
      }
      toast.success((result.data as any).message || 'Status updated and email queued.');
      closeContactModal();
    } else {
      // This case might not be hit if cloud function throws an error, which is caught by catch block
      toast.error((result.data as any).message || 'Failed to update status or send email.');
    }
  } catch (error: any) {
    console.error('Error calling contactApplicantAndUpdateStatus:', error);
    toast.error(error.message || 'An unexpected error occurred.');
  } finally {
    isSubmitting.value = false;
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
                  @click="openContactModal(applicant)"
                  class="text-blue-600 hover:text-blue-900 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Contact & Update Status"
                >
                  Contact/Update
                </button>
                <!--
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
                -->
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Contact Applicant Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div class="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h3 class="text-xl sm:text-2xl font-bold mb-6 text-purple-700">Contact Applicant & Update Status</h3>

        <div v-if="selectedApplicant" class="mb-4">
          <p class="text-sm text-gray-600">Applicant: <span class="font-semibold">{{ selectedApplicant.applicantName }}</span></p>
          <p class="text-sm text-gray-600">Current Status: <span class="font-semibold">{{ selectedApplicant.status }}</span></p>
        </div>

        <form @submit.prevent="handleSendEmailAndUpdateStatus">
          <div class="mb-4">
            <label for="newStatus" class="block text-sm font-medium text-gray-700 mb-1">New Status <span class="text-red-500">*</span></label>
            <select
              id="newStatus"
              v-model="newStatus"
              required
              class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="" disabled>Select a status</option>
              <option v-for="status in availableStatuses" :key="status" :value="status">
                {{ status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ') }}
              </option>
            </select>
          </div>

          <div class="mb-4">
            <label for="emailSubject" class="block text-sm font-medium text-gray-700 mb-1">Email Subject <span class="text-red-500">*</span></label>
            <input
              type="text"
              id="emailSubject"
              v-model="emailSubject"
              required
              class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="e.g., Update on your application"
            />
          </div>

          <div class="mb-6">
            <label for="emailBody" class="block text-sm font-medium text-gray-700 mb-1">Email Body <span class="text-red-500">*</span></label>
            <textarea
              id="emailBody"
              v-model="emailBody"
              required
              rows="6"
              class="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Dear Applicant..."
            ></textarea>
          </div>

          <div class="flex items-center justify-end space-x-3 sm:space-x-4">
            <button
              type="button"
              @click="closeContactModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              :disabled="isSubmitting"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">Sending...</span>
              <span v-else>Send & Update Status</span>
            </button>
          </div>
        </form>
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
