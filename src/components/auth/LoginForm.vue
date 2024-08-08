<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const email = ref('');
const password = ref('');

const handleLogin = () => {
  // Add your login logic here
  console.log('Email:', email.value);
  console.log('Password:', password.value);
};
</script>

<template>
  <div class="flex justify-center items-center min-h-screen bg-gray-100">
    <form @submit.prevent="handleLogin" class="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
      
      <div class="mb-4 relative">
        <label for="email" class="block text-gray-700">Email</label>
        <i class="pi pi-envelope absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
        <input 
          v-model="email"
          type="email" 
          id="email" 
          class="w-full pl-10 pr-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600" 
          required 
        />
      </div>
      
      <div class="mb-6 relative">
        <label for="password" class="block text-gray-700">Password</label>
        <i class="pi pi-lock absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
        <input 
          v-model="password"
          type="password" 
          id="password" 
          class="w-full pl-10 pr-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600" 
          required 
        />
      </div>
      
      <button 
        type="submit" 
        class="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200"
      >
        Login
      </button>

      <div class="mt-4 text-center text-gray-600">
        Don't have an account? 
        <RouterLink 
          to="/signup" 
          class="text-purple-500 hover:text-purple-600 ml-1"
        >
          Sign up
        </RouterLink>
      </div>
    </form>
  </div>
</template>
