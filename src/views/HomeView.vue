<script setup lang="ts">
import CustomHero from '@/components/CustomHero.vue';
import  HomeCards from '@/components/HomeCards.vue'
import JobList from '@/components/JobList.vue';
</script>

<template>
  <CustomHero />
  <HomeCards />
  <JobList :limit="3" :showButton="true" />
</template>