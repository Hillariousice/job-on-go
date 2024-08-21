<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import router from '@/router';
import { company_signup } from '@/api/company/signup';

const toast = useToast();
const name = ref('');
const description = ref('');
const phone = ref('');
const email = ref('');
const password = ref('');


const handleSignup = async () => {
  const companyInfo = {
    name: name.value,
    description: description.value,
    email: email.value,
    password: password.value,
    phone: phone.value,
    email_verified: false, 
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString(),
    token: '' 
  };

  const result = await company_signup(companyInfo);

  if (result?.success) {
    toast.success('Company added successfully');
    console.log('Signup successful:', result?.user);
    router.push(`/login`);
  } else {
    console.error('Signup failed');
    toast.error('User was not added');
  }
};

</script>


<template>
  <div class="flex justify-center items-center min-h-screen bg-gray-100">
    <form @submit.prevent="handleSignup" class="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-6 text-center">SignUp</h2>
      
      <div class="mb-4 relative">
        <label for="name" class="block text-gray-700">Name</label>
        <i class="pi pi-user absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
        <input 
          v-model="name"
          type="text" 
          id="name" 
          class="w-full pl-10 pr-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600" 
          required 
        />
      </div>
      <div class="mb-4 relative">
        <label for="description" class="block text-gray-700">Description</label>
        <i class="pi pi-user absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
        <input 
          v-model="description"
          type="text" 
          id="description" 
          class="w-full pl-10 pr-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600" 
          required 
        />  
      </div>
      <div class="mb-4 relative">
        <label for="phone" class="block text-gray-700">Phone</label>
        <i class="pi pi-phone absolute right-2 top-2/3 transform -translate-y-1/2 text-gray-400"></i>
        <input 
          v-model="phone"
          type="text" 
          id="phone" 
          class="w-full pl-10 pr-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600" 
          required 
        />
      </div>
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
        SignUp
      </button>

      <div class="mt-4 text-center text-gray-600">
        Don't have an account? 
        <RouterLink 
          to="/login" 
          class="text-purple-500 hover:text-purple-600 ml-1"
        >
          Login
        </RouterLink>
      </div>
    </form>
  </div>
</template>
