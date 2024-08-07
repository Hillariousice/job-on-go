<script setup lang="ts">
import { RouterLink } from 'vue-router';
import CustomCard from '@/components/CustomCard.vue'
</script>

<template>
     <section class="py-4">
    <div class="container-xl lg:container m-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg">
        <CustomCard>
          <h2 class="text-2xl font-bold">For Developers</h2>
          <p class="mt-2 mb-4">
            Browse our Frontend jobs and start your career today
          </p>
          <RouterLink
            to="/jobs"
            class="inline-block bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-700"
          >
            Browse Jobs
          </RouterLink>
        </CustomCard>
        <CustomCard bg="bg-purple-100">
          <h2 class="text-2xl font-bold">For Employers</h2>
          <p class="mt-2 mb-4">
            List your job to find the perfect developer for the role
          </p>
          <RouterLink
            to="/jobs/add"
            class="inline-block bg-purple-500 text-white rounded-lg px-4 py-2 hover:bg-purple-600"
          >
            Add Job
          </RouterLink>
        </CustomCard>
      </div>
    </div>
  </section>
</template>
