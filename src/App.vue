<script setup lang="ts">
import Navbar from '@/components/NavBar.vue';
import AppFooter from '@/components/custom/AppFooter.vue'; // Added import for AppFooter
import { RouterView } from 'vue-router';
console.log('App.vue setup script executed');
</script>
<template>
  <div class="flex flex-col min-h-screen">
    <Navbar/>
    <main class="flex-grow">
      <RouterView/>
    </main>
    <AppFooter />
  </div>
</template>