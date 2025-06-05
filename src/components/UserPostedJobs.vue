<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import JobListing from '@/components/jobs/JobListing.vue'; // Assuming JobListing is in this path
import Loading from 'vue-loading-overlay'; // For loading state

// Define Job interface (can be imported if centralized)
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
  userId?: string; // userId of the job poster
  createdAt?: Timestamp | Date | string; // Optional for consistency
}

const auth = getAuth();
const currentUserUID = ref<string | null>(null);
let authListenerUnsubscribe: (() => void) | null = null;

const state = reactive<{
  userJobs: Job[];
  isLoading: boolean;
}>({
  userJobs: [],
  isLoading: true,
});

let jobsSnapshotUnsubscribe: (() => void) | null = null;

const fetchUserJobs = () => {
  if (!currentUserUID.value) {
    state.isLoading = false; // Not logged in or UID not yet available
    state.userJobs = [];
    return;
  }

  state.isLoading = true;
  const jobsQuery = query(
    collection(db, 'jobs'),
    where('userId', '==', currentUserUID.value)
  );

  jobsSnapshotUnsubscribe = onSnapshot(
    jobsQuery,
    (querySnapshot) => {
      state.userJobs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Job, 'id'>),
      }));
      state.isLoading = false;
    },
    (error) => {
      console.error('Error fetching user jobs:', error);
      state.isLoading = false;
      // Optionally, show a toast error
    }
  );
};

onMounted(() => {
  authListenerUnsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserUID.value = user.uid;
      fetchUserJobs(); // Fetch jobs once UID is confirmed
    } else {
      currentUserUID.value = null;
      state.userJobs = []; // Clear jobs if user logs out
      state.isLoading = false;
    }
  });
});

onUnmounted(() => {
  if (authListenerUnsubscribe) {
    authListenerUnsubscribe();
  }
  if (jobsSnapshotUnsubscribe) {
    jobsSnapshotUnsubscribe();
  }
});
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-semibold mb-6 text-purple-600">My Posted Jobs</h2>

    <div v-if="state.isLoading" class="text-center py-6">
      <Loading v-model:active="state.isLoading" :is-full-page="false" :height="60" :width="60" />
    </div>

    <div v-else-if="state.userJobs.length === 0" class="text-center text-gray-500 py-10">
      <p>You have not posted any jobs yet.</p>
      <RouterLink
        to="/jobs/add"
        class="mt-4 inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline"
      >
        Post a Job
      </RouterLink>
    </div>

    <div v-else class="grid grid-cols-1 gap-6">
      <JobListing
        v-for="job in state.userJobs"
        :key="job.id"
        :job="job"
        :showEditIcon="true"
      />
    </div>
  </div>
</template>
