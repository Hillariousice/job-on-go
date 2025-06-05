<script setup lang="ts">
import BackButton from '@/components/custom/CustomBackButton.vue';
import { reactive, onMounted, ref, computed } from 'vue';
import { useRoute, RouterLink, useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import { doc, getDoc, deleteDoc, addDoc, collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import BackButton from '@/components/custom/CustomBackButton.vue'; // Ensure BackButton is imported

interface Job {
  id: string;
  title: string;
  type: string;
  description: string;
  location: string;
  salary: string;
  company: {
    name: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
  };
  userId: string;
  applicantLimit?: number; // Optional: older jobs might not have this
}

const route = useRoute();
const router = useRouter();
const toast = useToast();

const jobId = route.params.id as string;

const state = reactive<{
  job: Job;
  isLoading: boolean;
}>({
  job: {
    id: '',
    title: '',
    type: '',
    description: '',
    location: '',
    salary: '',
    company: {
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
    },
    userId: '',
    applicantLimit: 0, // Default to 0 (no limit)
  },
  isLoading: true,
});

const isAuthenticated = ref(false);
const currentUserUID = ref<string | null>(null);
const applicationsCount = ref(0);
const auth = getAuth();


const checkAuth = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true;
      currentUserUID.value = user.uid;
    } else {
      isAuthenticated.value = false;
      currentUserUID.value = null;
      // No automatic redirect here, let the view handle it or specific actions
    }
  });
};

const isOwner = computed(() => {
  if (!isAuthenticated.value || !currentUserUID.value || !state.job.userId) {
    return false;
  }
  return currentUserUID.value === state.job.userId;
});

const fetchApplicationsCount = async () => {
  try {
    const applicationsRef = collection(db, 'applications');
    const q = query(applicationsRef, where('jobId', '==', jobId));
    const snapshot = await getCountFromServer(q);
    applicationsCount.value = snapshot.data().count;
  } catch (error) {
    console.error('Error fetching applications count:', error);
    // Do not toast here, as it might be confusing during page load
  }
};

const isApplicationLimitReached = computed(() => {
  if (!state.job.applicantLimit || state.job.applicantLimit <= 0) {
    return false; // No limit defined or it's zero/negative
  }
  return applicationsCount.value >= state.job.applicantLimit;
});

const fetchJob = async () => {
  state.isLoading = true;
  try {
    const jobDocRef = doc(db, "jobs", jobId);
    const jobDoc = await getDoc(jobDocRef);

    if (jobDoc.exists()) {
      state.job = { ...jobDoc.data(), id: jobDoc.id } as Job;
      state.job.applicantLimit = state.job.applicantLimit || 0; // Ensure it's a number
    } else {
      console.error('No such job!');
      toast.error('Job not found.');
      router.push('/jobs');
      return; // Important to return if job not found
    }
  } catch (error) {
    console.error('Error fetching job', error);
    toast.error('Error fetching job details.');
  } finally {
    state.isLoading = false;
  }
};

onMounted(async () => {
  checkAuth();
  await fetchJob();
  if (state.job.id) { // Only fetch count if job was loaded successfully
    await fetchApplicationsCount();
  }
});

const deleteJob = async () => {
  try {
    const confirmResult = window.confirm('Are you sure you want to delete this job?');
    if (confirmResult) {
      const jobDocRef = doc(db, "jobs", jobId);
      await deleteDoc(jobDocRef);
      toast.success('Job Deleted Successfully');
      router.push('/jobs');
    }
  } catch (error) {
    console.error('Error deleting job', error);
    toast.error('Job Not Deleted');
  }
};

const handleApplyNow = async () => {
  if (!isAuthenticated.value || !currentUserUID.value) { // Check isAuthenticated first
    toast.error('You must be logged in to apply.');
    router.push('/login'); // Redirect to login if not authenticated
    return;
  }

  if (isOwner.value) {
    toast.error('You cannot apply to your own job.');
    return;
  }

  // Refresh count before final check
  await fetchApplicationsCount();
  if (isApplicationLimitReached.value) {
    toast.error('Application limit reached for this job.');
    return;
  }

  try {
    const applicationData = {
      jobId: jobId,
      applicantId: currentUserUID.value,
      applicationDate: new Date(),
      status: 'pending',
    };

    const docRef = await addDoc(collection(db, 'applications'), applicationData);
    if (docRef.id) {
      applicationsCount.value += 1; // Increment local count
      toast.success('Application submitted successfully!');
    } else {
       toast.error('Failed to submit application. Please try again.');
    }
  } catch (error) {
    console.error('Error submitting application:', error);
    toast.error('Failed to submit application.');
  }
};
</script>

<template>
  <BackButton />
  <section v-if="!state.isLoading && state.job.id" class="bg-purple-50">
    <div class="container m-auto py-10 px-4 sm:px-6">
      <div class="grid grid-cols-1 md:grid-cols-70/30 w-full gap-6">
        <main>
          <div class="bg-white p-4 sm:p-6 rounded-lg shadow-md text-center md:text-left">
            <div class="text-gray-500 mb-4">{{ state.job.type }}</div>
            <h1 class="text-3xl font-bold mb-4">{{ state.job.title }}</h1>
            <div class="text-gray-500 mb-4 flex align-middle justify-center md:justify-start">
              <i class="pi pi-map-marker text-xl text-orange-700 mr-2"></i>
              <p class="text-orange-700">{{ state.job.location }}</p>
            </div>
          </div>

          <div class="bg-white p-4 sm:p-6 rounded-lg shadow-md mt-6">
            <h3 class="text-purple-800 text-lg font-bold mb-6">Job Description</h3>
            <p class="mb-4">{{ state.job.description }}</p>
            <h3 class="text-purple-800 text-lg font-bold mb-2">Salary</h3>
            <p class="mb-4">{{ state.job.salary }} / Year</p>
            <div v-if="state.job.applicantLimit && state.job.applicantLimit > 0" class="mt-4">
              <h3 class="text-purple-800 text-lg font-bold mb-2">Applicant Limit</h3>
              <p class="mb-4">This job has a limit of {{ state.job.applicantLimit }} applicants. Currently: {{ applicationsCount }} application(s).</p>
            </div>
          </div>
        </main>

        <!-- Sidebar -->
        <aside>
          <!-- Company Info -->
          <div class="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-bold mb-6">Company Info</h3>
            <h2 class="text-2xl">{{ state.job.company.name }}</h2>
            <p class="my-2">{{ state.job.company.description }}</p>
            <hr class="my-4" />
            <h3 class="text-xl">Contact Email:</h3>
            <p class="my-2 bg-purple-100 p-2 font-bold">{{ state.job.company.contactEmail }}</p>
            <h3 class="text-xl">Contact Phone:</h3>
            <p class="my-2 bg-purple-100 p-2 font-bold">{{ state.job.company.contactPhone }}</p>

            <div v-if="isAuthenticated && !isOwner" class="mt-4">
              <button
                @click="handleApplyNow"
                :disabled="isApplicationLimitReached"
                class="bg-purple-500 hover:bg-purple-600 text-white text-center font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline block"
                :class="{ 'opacity-50 cursor-not-allowed': isApplicationLimitReached }"
              >
                Apply Now
              </button>
              <p v-if="isApplicationLimitReached" class="text-sm text-red-600 text-center mt-2">
                Applications for this job are now closed due to the limit.
              </p>
            </div>
            <div v-else-if="!isAuthenticated && state.job.id" class="mt-4"> <!-- Added state.job.id to ensure job loaded -->
               <p class="text-sm text-gray-600 text-center">Please <RouterLink to="/login" class="text-purple-600 hover:underline">log in</RouterLink> to apply.</p>
            </div>
          </div>

          <!-- Manage -->
          <div v-if="isAuthenticated && isOwner" class="bg-white p-4 sm:p-6 rounded-lg shadow-md mt-6">
            <h3 class="text-xl font-bold mb-6">Manage Job</h3>
            <RouterLink
              :to="`/jobs/edit/${jobId}`"
              class="bg-purple-500 hover:bg-purple-600 text-white text-center font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block"
            >
              Edit Job
            </RouterLink>
            <button
              @click="deleteJob"
              class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block"
            >
              Delete Job
            </button>
          </div>
        </aside>
      </div>
    </div>
  </section>
  <section v-else-if="!state.isLoading && !state.job.id" class="text-center py-10">
    <p class="text-xl text-red-500">Job not found.</p>
    <RouterLink to="/jobs" class="text-purple-600 hover:underline mt-2 block">Go back to jobs</RouterLink>
  </section>
  <div v-else class="text-center text-gray-500 py-6">
    <p>Loading job details...</p>
  </div>
</template>
