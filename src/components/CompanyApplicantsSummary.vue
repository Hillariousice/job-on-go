<script setup lang="ts">
import { ref } from 'vue';
import { db, auth } from '@/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { useRouter } from 'vue-router';

interface ApplicantSummary {
  applicationId: string;
  applicantId?: string; // UID of the applicant
  applicantName?: string;
  applicantEmail?: string;
  jobId: string;
  jobTitle?: string;
  applicationDate: Date;
  status: string;
}

const applicantsSummaryList = ref<ApplicantSummary[]>([]);
const isLoading = ref(true);
const currentUser = ref<User | null>(null);
const router = useRouter();

onAuthStateChanged(auth, (user) => {
  currentUser.value = user;
  if (user) {
    fetchCompanyApplicantsSummary();
  } else {
    applicantsSummaryList.value = [];
    isLoading.value = false;
  }
});

const fetchCompanyApplicantsSummary = async () => {
  if (!currentUser.value) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  const summaryList: ApplicantSummary[] = [];

  try {
    // 1. Fetch all jobs posted by the current user (company)
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('userId', '==', currentUser.value.uid)
    );
    const jobsSnapshot = await getDocs(jobsQuery);

    if (jobsSnapshot.empty) {
      isLoading.value = false;
      return; // No jobs posted by this user
    }

    // 2. For each job, fetch its applications
    for (const jobDoc of jobsSnapshot.docs) {
      const jobData = jobDoc.data();
      const jobId = jobDoc.id;
      const jobTitle = jobData.title || 'N/A';

      const applicationsQuery = query(
        collection(db, 'applications'),
        where('jobId', '==', jobId)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);

      // 3. For each application, fetch applicant's details
      for (const appDoc of applicationsSnapshot.docs) {
        const appData = appDoc.data();
        let applicantName = 'N/A';
        let applicantEmail = 'N/A';

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

        let appDate: Date;
        if (appData.applicationDate instanceof Timestamp) {
          appDate = appData.applicationDate.toDate();
        } else if (typeof appData.applicationDate === 'string') {
          appDate = new Date(appData.applicationDate);
        } else {
          appDate = new Date(); // Fallback
        }

        summaryList.push({
          applicationId: appDoc.id,
          applicantId: appData.applicantId,
          applicantName,
          applicantEmail,
          jobId,
          jobTitle,
          applicationDate: appDate,
          status: appData.status || 'Pending',
        });
      }
    }
    // Sort by application date, newest first
    applicantsSummaryList.value = summaryList.sort((a, b) => b.applicationDate.getTime() - a.applicationDate.getTime());
  } catch (error) {
    console.error('Error fetching company applicants summary:', error);
    // Optionally set an error state
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (date: Date | undefined) => {
  if (!date) return 'N/A';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const getStatusClass = (status: string) => {
  status = status.toLowerCase();
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'shortlisted': return 'bg-blue-100 text-blue-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'hired': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const viewJobApplicants = (jobId: string) => {
  router.push(`/jobs/${jobId}/applicants`);
};

</script>

<template>
  <div class="bg-white shadow-md rounded-lg p-4 sm:p-6 mt-6">
    <h2 class="text-xl sm:text-2xl font-bold text-purple-700 mb-6">Applicants Summary (All Jobs)</h2>
    <div v-if="isLoading" class="text-center py-8">
      <p class="text-gray-500">Loading applicants summary...</p>
    </div>
    <div v-else-if="!currentUser" class="text-center py-8">
      <p class="text-gray-600">Please log in to view this summary.</p>
    </div>
    <div v-else-if="applicantsSummaryList.length === 0" class="text-center py-8">
      <p class="text-gray-600">No applicants found for any of your job postings yet.</p>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Applicant Name
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Email
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job Title Applied For
            </th>
            <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Applied Date
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
          <tr v-for="summary in applicantsSummaryList" :key="summary.applicationId">
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ summary.applicantName }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
              {{ summary.applicantEmail }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
              <router-link :to="`/jobs/${summary.jobId}`" class="hover:underline" :title="`View job: ${summary.jobTitle}`">
                {{ summary.jobTitle }}
              </router-link>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
              {{ formatDate(summary.applicationDate) }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
              <span
                :class="getStatusClass(summary.status)"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ summary.status }}
              </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
              <button
                @click="viewJobApplicants(summary.jobId)"
                class="text-purple-600 hover:text-purple-800 hover:underline"
                title="View all applicants for this job"
              >
                View Job Applicants
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* Additional scoped styles if needed */
</style>
