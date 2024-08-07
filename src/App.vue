<script setup lang="ts">
import Navbar from '@/components/NavBar.vue';
import { RouterView } from 'vue-router';
console.log('App.vue setup script executed');
</script>
<template>
<Navbar/>
<RouterView/>
</template>