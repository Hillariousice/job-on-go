<script setup lang="ts">
import { computed, onMounted, reactive, ref, onUnmounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Firebase imports
import { collection, query, onSnapshot, Timestamp } from 'firebase/firestore'; // Firestore imports
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
  };
  createdAt?: Timestamp | Date | string; // Optional to handle existing data, can be Firestore Timestamp, Date object, or ISO string
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
const isFilterDropdownOpen = ref(false); // For filter dropdown visibility
const currentSortOrder = ref('latest'); // 'latest', 'oldest', or ''
const selectedLocations = ref<string[]>([]); // For location filter
const selectedJobTypes = ref<string[]>([]); // For job type filter
const availableJobTypes = ['Full-Time', 'Part-Time', 'Remote', 'Internship'];
let unsubscribeJobs: () => void = () => {}; // To store the unsubscribe function

// Fetch authenticated user data
const checkAuth = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true
      userProfile.value = {
        name: user.firstName || "User"
        profilePicture: user.photoURL || "https://via.placeholder.com/150"
      };
    } else {
      isAuthenticated.value = false;
      userProfile.value = { name: "", profilePicture: "" };
    }
  });
};

// Fetch job listings from Firestore with real-time updates
const fetchJobs = () => {
  state.isLoading = true;
  const jobsQuery = query(collection(db, "jobs")); // Replace "jobs" with your collection name

  unsubscribeJobs = onSnapshot(jobsQuery, (querySnapshot) => {
    state.jobs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Job, 'id'>)
    }));
    filterJobs(); // Update filtered jobs whenever a snapshot is received
    state.isLoading = false; // Set loading to false after first data load
  }, (error) => {
    console.error('Error fetching real-time jobs:', error);
    state.isLoading = false; // Also stop loading on error
  });
};

// Filter jobs based on search query
const filterJobs = () => {
  const searchTerm = searchQuery.value.toLowerCase();
  if (!searchTerm.trim()) {
    filteredJobs.value = state.jobs; // If search query is empty, show all jobs
    return;
  }
  filteredJobs.value = state.jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm) ||
    job.company.name.toLowerCase().includes(searchTerm) ||
    job.location.toLowerCase().includes(searchTerm) ||
    job.description.toLowerCase().includes(searchTerm) ||
    job.type.toLowerCase().includes(searchTerm) ||
    job.salary.toLowerCase().includes(searchTerm)
  );
};

const goToAddJob = () => {
  router.push('/jobs/add'); 
};

// Lifecycle hook to check authentication and fetch jobs
onMounted(() => {
  checkAuth();
  fetchJobs(); // Sets up the real-time listener
});

onUnmounted(() => {
  if (unsubscribeJobs) {
    unsubscribeJobs(); // Detach the listener when component is unmounted
  }
});

// Computed property for unique locations
const uniqueLocations = computed(() => {
  const locations = new Set<string>();
  state.jobs.forEach(job => {
    if (job.location && job.location.trim() !== "") { // Ensure location is not empty/undefined
      locations.add(job.location.trim());
    }
  });
  return Array.from(locations).sort();
});

// Computed property for filtered and sorted jobs
const displayJobs = computed(() => {
  let jobsToDisplay = [...filteredJobs.value]; // Start with search-filtered jobs

  // Apply location filter
  if (selectedLocations.value.length > 0) {
    jobsToDisplay = jobsToDisplay.filter(job =>
      job.location && selectedLocations.value.includes(job.location.trim())
    );
  }

  // Apply job type filter
  if (selectedJobTypes.value.length > 0) {
    jobsToDisplay = jobsToDisplay.filter(job =>
      job.type && selectedJobTypes.value.includes(job.type)
    );
  }

  // Apply sorting
  if (currentSortOrder.value === 'latest') {
    jobsToDisplay.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : new Date(a.createdAt as string | Date).getTime()) : 0;
      const dateB = b.createdAt ? (b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : new Date(b.createdAt as string | Date).getTime()) : 0;
      return dateB - dateA; // Descending for latest
    });
  } else if (currentSortOrder.value === 'oldest') {
    jobsToDisplay.sort((a, b) => {
      const dateA = a.createdAt ? (a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : new Date(a.createdAt as string | Date).getTime()) : 0;
      const dateB = b.createdAt ? (b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : new Date(b.createdAt as string | Date).getTime()) : 0;
      return dateA - dateB; // Ascending for oldest
    });
  }
  return jobsToDisplay;
});

// Computed property for active filter count
const activeFilterCount = computed(() => {
  let count = 0;
  if (selectedLocations.value.length > 0) {
    count++;
  }
  if (selectedJobTypes.value.length > 0) {
    count++;
  }
  return count;
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
      <img :src="userProfile.profilePicture" alt="Profile" class="h-10 w-10 rounded-full mr-4" />
      <h1 class="text-lg font-bold md:text-xl">Welcome, {{ userProfile?.name }}</h1>
    </div>

    <!-- Search Bar with Button beside Input -->
    <div class="flex mb-6 items-center">
      <input
        v-model="searchQuery"
        @input="filterJobs"
        type="text"
        placeholder="Search for jobs..."
        class="flex-grow p-2 border border-gray-300 rounded-l-md"
      />
      <button
        @click="filterJobs"
        class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-r-md focus:outline-none focus:shadow-outline"
      >
        Search
      </button>
      <!-- Filter Icon Button -->
      <button
        @click="isFilterDropdownOpen = !isFilterDropdownOpen"
        type="button"
        aria-label="Open filters"
        :aria-expanded="isFilterDropdownOpen"
        class="relative ml-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <i class="pi pi-filter text-gray-600"></i>
        <span v-if="activeFilterCount > 0" class="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {{ activeFilterCount }}
        </span>
      </button>
    </div>

    <!-- Filter Dropdown -->
    <div v-if="isFilterDropdownOpen" class="bg-white p-4 mt-2 mb-6 border border-gray-300 rounded-md shadow-lg">
      <h3 class="text-lg font-semibold mb-2">Filters</h3>
      <!-- Date Sort Section -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Sort by Date</label>
        <div class="flex items-center space-x-4 mt-1">
          <div>
            <input type="radio" id="sortLatest" value="latest" v-model="currentSortOrder" class="mr-1 h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500">
            <label for="sortLatest" class="text-sm text-gray-700">Latest</label>
          </div>
          <div>
            <input type="radio" id="sortOldest" value="oldest" v-model="currentSortOrder" class="mr-1 h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500">
            <label for="sortOldest" class="text-sm text-gray-700">Oldest</label>
          </div>
        </div>
      </div>
      <!-- Location Filter Section -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Location</label>
        <div class="max-h-32 overflow-y-auto mt-1 border rounded-md p-2 space-y-1">
          <div v-if="uniqueLocations.length === 0" class="text-xs text-gray-500">No locations to show.</div>
          <div v-for="location in uniqueLocations" :key="location" class="flex items-center">
            <input
              type="checkbox"
              :id="'loc-' + location.replace(/\s+/g, '-')"
              :value="location"
              v-model="selectedLocations"
              class="mr-2 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            >
            <label :for="'loc-' + location.replace(/\s+/g, '-')" class="text-sm text-gray-700">{{ location }}</label>
          </div>
        </div>
        <button
          v-if="selectedLocations.length > 0"
          @click="selectedLocations = []"
          class="mt-2 text-xs text-purple-600 hover:text-purple-800 focus:outline-none"
        >
          Clear location selection
        </button>
      </div>
      <!-- Job Type Filter Section -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Job Type</label>
        <div class="max-h-32 overflow-y-auto mt-1 border rounded-md p-2 space-y-1">
          <div v-for="jobType in availableJobTypes" :key="jobType" class="flex items-center">
            <input
              type="checkbox"
              :id="'type-' + jobType.replace(/\s+/g, '-')"
              :value="jobType"
              v-model="selectedJobTypes"
              class="mr-2 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            >
            <label :for="'type-' + jobType.replace(/\s+/g, '-')" class="text-sm text-gray-700">{{ jobType }}</label>
          </div>
        </div>
        <button
          v-if="selectedJobTypes.length > 0"
          @click="selectedJobTypes = []"
          class="mt-2 text-xs text-purple-600 hover:text-purple-800 focus:outline-none"
        >
          Clear job type selection
        </button>
      </div>
    </div>

    <!-- Job Listings -->
    <div class="grid grid-cols-1 gap-4">
      <div v-if="state.isLoading" class="flex item-center text-center justify-center text-gray-500 py-6">
        <Loading v-model:active="state.isLoading" :is-full-page="true" />
      </div>
      <template v-else>
        <div v-if="displayJobs.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <JobListing
            v-for="job in displayJobs.slice(0, props.limit || displayJobs.length)"
            :key="job.id"
            :job="job"
          />
        </div>
        <div v-else class="text-center text-gray-500 py-10">
          <p>No jobs found matching your current search and filter criteria.</p>
        </div>
      </template>
      <!-- Add Job Button -->
      <div class="text-center mt-6">
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

