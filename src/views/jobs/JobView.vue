<script setup lang="ts">
import BackButton from '@/components/custom/CustomBackButton.vue';
import { reactive, onMounted, ref } from 'vue';
import { useRoute, RouterLink, useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

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
  },
  isLoading: true,
});

const isAuthenticated = ref(false);

const checkAuth = () => {
  const token = localStorage.getItem('authToken');
  // Basic token check; consider validating with your backend
  if (token) {
    isAuthenticated.value = true;
  } else {
    isAuthenticated.value = false;
  }
};

onMounted(() => {
  checkAuth();
  fetchJob();
});

const fetchJob = async () => {
  try {
    const jobDocRef = doc(db, "jobs", jobId);
    const jobDoc = await getDoc(jobDocRef);

    if (jobDoc.exists()) {
      state.job = jobDoc.data() as Job;
    } else {
      console.error('No such job!');
    }
  } catch (error) {
    console.error('Error fetching job', error);
  } finally {
    state.isLoading = false;
  }
};

const deleteJob = async () => {
  try {
    const confirm = window.confirm('Are you sure you want to delete this job?');
    if (confirm) {
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
</script>

<template>
  <BackButton />
  <section v-if="!state.isLoading" class="bg-purple-50">
    <div class="container m-auto py-10 px-6">
      <div class="grid grid-cols-1 md:grid-cols-70/30 w-full gap-6">
        <main>
          <div class="bg-white p-6 rounded-lg shadow-md text-center md:text-left">
            <div class="text-gray-500 mb-4">{{ state.job.type }}</div>
            <h1 class="text-3xl font-bold mb-4">{{ state.job.title }}</h1>
            <div class="text-gray-500 mb-4 flex align-middle justify-center md:justify-start">
              <i class="pi pi-map-marker text-xl text-orange-700 mr-2"></i>
              <p class="text-orange-700">{{ state.job.location }}</p>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md mt-6">
            <h3 class="text-purple-800 text-lg font-bold mb-6">Job Description</h3>
            <p class="mb-4">{{ state.job.description }}</p>
            <h3 class="text-purple-800 text-lg font-bold mb-2">Salary</h3>
            <p class="mb-4">{{ state.job.salary }} / Year</p>
          </div>
        </main>

        <!-- Sidebar -->
        <aside>
          <!-- Company Info -->
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-bold mb-6">Company Info</h3>
            <h2 class="text-2xl">{{ state.job.company.name }}</h2>
            <p class="my-2">{{ state.job.company.description }}</p>
            <hr class="my-4" />
            <h3 class="text-xl">Contact Email:</h3>
            <p class="my-2 bg-purple-100 p-2 font-bold">{{ state.job.company.contactEmail }}</p>
            <h3 class="text-xl">Contact Phone:</h3>
            <p class="my-2 bg-purple-100 p-2 font-bold">{{ state.job.company.contactPhone }}</p>
          </div>

          <!-- Manage -->
          <div v-if="isAuthenticated" class="bg-white p-6 rounded-lg shadow-md mt-6">
            <h3 class="text-xl font-bold mb-6">Manage Job</h3>
            <RouterLink
              :to="`/jobs/edit/${state.job.id}`"
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

  <div v-else class="text-center text-gray-500 py-6">
    <Loading v-model:active="state.isLoading" :is-full-page="true" />
  </div>
</template>
