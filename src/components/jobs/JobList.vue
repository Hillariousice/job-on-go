<script setup lang="ts">
import { RouterLink } from 'vue-router';
import JobListing from './JobListing.vue';
import { reactive, defineProps, onMounted, ref } from 'vue';
import Loading from 'vue-loading-overlay';
import axios from 'axios';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';


interface Job {
  id: string;
  title: string;
  type: string;
  description: string;
  location: string;
  salary: string;
  company:{
    name: string;
    description: string;
    contactEmail:  string;
    contactPhone:  string;
  }
}


defineProps({
  limit: Number,
  showButton: {
    type: Boolean,
    default: false,
  },
});


const state = reactive<{
  jobs: Job[];
  isLoading: boolean;
}>({
  jobs: [],
  isLoading: true,
});

const isLoading = ref(false);
onMounted(async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'jobs'));
    state.jobs = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data() as Omit<Job, 'id'>
    }));
  } catch (error) {
    console.error('Error fetching jobs', error);
  } finally {
    state.isLoading = false;
  }
});
</script>

<template>
  <section class="bg-blue-50 px-4 py-10">
    <div class="container-xl lg:container m-auto">
      <h2 class="text-3xl font-bold text-purple-500 mb-6 text-center">
        Browse Jobs
      </h2>
      <!-- Show loading spinner while loading is true -->
      <div v-if="state.isLoading" class="text-center text-gray-500 py-6">
        <Loading v-model:active="isLoading" :is-full-page="true"/>
      </div>

      <!-- Show job listing when done loading -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <JobListing
          v-for="job in state.jobs.slice(0, limit || state.jobs.length)"
          :key="job.id"
          :job="job"
        />
      </div>
    </div>
  </section>

  <section v-if="showButton" class="m-auto max-w-lg my-10 px-6">
    <RouterLink
      to="/jobs"
      class="block bg-black text-white text-center py-4 px-6 rounded-xl hover:bg-gray-700"
    >
      View All Jobs
    </RouterLink>
  </section>
</template>
