<script setup lang="ts">
import UserProfileDetails from '@/components/UserProfileDetails.vue';
import UserPostedJobs from '@/components/UserPostedJobs.vue';
</script>

<template>
  <section class="container mx-auto p-4 py-6">
    <h1 class="text-3xl font-bold text-center mb-8 text-purple-700">User Profile</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-1">
        <UserProfileDetails />
      </div>
      <div class="md:col-span-2">
        <UserPostedJobs />
      </div>
    </div>
  </section>
</template>
