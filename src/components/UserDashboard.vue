<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase imports
import { collection, getDocs, query } from 'firebase/firestore'; // Firestore imports
import { db } from '@/firebaseConfig'
import router from '@/router';
import Loading from 'vue-loading-overlay'; // Import Loading component
import JobListing from '@/components/jobs/JobListing.vue'; // Import JobListing component

const auth = getAuth();
const userProfile = ref({
  name: "",
  profilePicture: ""
});
const isAuthenticated = ref(false);

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
  }
}

// Define props
const props = defineProps<{
  limit?: number;
  showButton?: boolean;
}>();

// Job listings and search state
const state = reactive<{
  jobs: Job[];
  isLoading: boolean;
}>({
  jobs: [],
  isLoading: true,
});

const searchQuery = ref("");
const filteredJobs = ref<Job[]>([]); // Define filteredJobs

// Fetch authenticated user data
const checkAuth = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true;
      userProfile.value = {
        name: user.displayName || "User",
        profilePicture: user.photoURL || "https://via.placeholder.com/150"
      };
    } else {
      isAuthenticated.value = false;
      userProfile.value = { name: "", profilePicture: "" };
    }
  });
};

// Fetch job listings from Firestore
const fetchJobs = async () => {
  try {
    const jobsQuery = query(collection(db, "jobs")); // Replace "jobs" with your collection name
    const querySnapshot = await getDocs(jobsQuery);
    state.jobs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Job, 'id'>)
    }));
    filteredJobs.value = state.jobs; // Initialize filtered jobs
  } catch (error) {
    console.error('Error fetching jobs', error);
  } finally {
    state.isLoading = false;
  }
};

// Filter jobs based on search query
const filterJobs = () => {
  filteredJobs.value = state.jobs.filter((job) =>
    job.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    job.company.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
};

const goToAddJob = () => {
  router.push('/jobs/add'); 
};

// Lifecycle hook to check authentication and fetch jobs
onMounted(() => {
  checkAuth();
  fetchJobs();
});
</script>

<style scoped>
.container {
  max-width: 800px;
}
</style>

<template>
  <div class="container mx-auto p-4">
    <!-- Greeting Section -->
    <div class="flex items-center mb-6">
      <img :src="userProfile.profilePicture" alt="Profile" class="h-12 w-12 rounded-full mr-4" />
      <h1 class="text-2xl font-bold">Welcome, {{ userProfile.name }}</h1>
    </div>

    <!-- Search Bar -->
    <div class="mb-6">
      <input
        v-model="searchQuery"
        @input="filterJobs"
        type="text"
        placeholder="Search for jobs..."
        class="w-full p-2 border border-gray-300 rounded-md"
      />
    </div>

    <!-- Job Listings -->
    <div class="grid grid-cols-1 gap-4">
      <div v-if="state.isLoading" class="text-center text-gray-500 py-6">
        <Loading v-model:active="state.isLoading" :is-full-page="true" />
      </div>

      <!-- Show job listing when done loading -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <JobListing
          v-for="job in filteredJobs.slice(0, props.limit || filteredJobs.length)"
          :key="job.id"
          :job="job"
        />
      </div>
      <!-- Add Job Button -->
      <div class="text-center">
        <button
          @click="goToAddJob"
          class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline"
        >
          Add Job
        </button>
      </div>
    </div>
  </div>
</template>
