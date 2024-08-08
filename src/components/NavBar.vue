<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router';
import logo from '@/assets/travelguide-high-resolution-logo-transparent.png'
import { onMounted, ref } from 'vue';

const isAuthenticated = ref(true);  // Change this to false to see the login page
const userProfile = ref({
  name: "John Doe",
  profilePicture: "https://via.placeholder.com/150"
});

const router = useRouter();
const isDropdownOpen = ref(false);

const isActiveLink = (routePath: string) => {
  const route = useRoute();
  return route.path === routePath;
};

const checkAuth = () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    // You might want to verify the token with the backend to ensure it's still valid
    isAuthenticated.value = true;
  } else {
    isAuthenticated.value = false;
  }
};
onMounted(() => {
  checkAuth();
});

const logout = () => {
  // Clear any stored tokens (adjust based on your auth setup)
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  // Reset the authentication state
  isAuthenticated.value = false;
  userProfile.value = { name: "", profilePicture: "" };

  // Redirect to the login page
  router.push('/login');
};

</script>

<template>
     <nav class="bg-purple-700 border-b border-purple-500">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="flex h-20 items-center justify-between">
        <div
          class="flex flex-1 items-center justify-center md:items-stretch md:justify-start"
        >
          <!-- Logo -->
          <RouterLink class="flex flex-shrink-0 items-center mr-6" to="/">
            <img class="h-10 w-auto" :src="logo" alt="Vue Jobs" />
            
          </RouterLink>
          <div class="md:ml-auto flex space-x-4">
            <div class="flex space-x-2">
              <RouterLink
                to="/"
                :class="[
                  isActiveLink('/')
                    ? 'bg-purple-900'
                    : 'hover:bg-gray-900 hover:text-white',
                  'text-white',
                  'px-3',
                  'py-2',
                  'rounded-md',
                ]"
                >Home</RouterLink
              >
              <RouterLink
                to="/jobs"
                :class="[
                  isActiveLink('/jobs')
                    ? 'bg-purple-900'
                    : 'hover:bg-gray-900 hover:text-white',
                  'text-white',
                  'px-3',
                  'py-2',
                  'rounded-md',
                ]"
                >Jobs</RouterLink
              >
              <RouterLink
                to="/jobs/add"
                v-if="isAuthenticated"
                :class="[
                  isActiveLink('/jobs/add')
                    ? 'bg-purple-900'
                    : 'hover:bg-gray-900 hover:text-white',
                  'text-white',
                  'px-3',
                  'py-2',
                  'rounded-md',
                ]"
                >Add Job</RouterLink
              >
              <RouterLink
                to="/login"
                :class="[
                  isActiveLink('/login')
                    ? 'bg-purple-900'
                    : 'hover:bg-gray-900 hover:text-white',
                  'text-white',
                  'px-3',
                  'py-2',
                  'rounded-md',
                ]"
                >Login</RouterLink
              >
              <div v-if="isAuthenticated" class="relative flex items-center">
                <img :src="userProfile.profilePicture" alt="Profile" class="h-8 w-8 rounded-full mr-2" />
                <div class="relative">
                  <button @click="isDropdownOpen = !isDropdownOpen"  class="text-white px-3 py-2 rounded-md focus:outline-none">
                    <i class="pi pi-cog"></i>
                  </button>
                  <!-- Dropdown -->
                  <div v-if="isDropdownOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2">
                    <RouterLink to="/profile" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">Profile</RouterLink>
                    <RouterLink to="/settings" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">Settings</RouterLink>
                    <RouterLink to="/manage-account" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">Manage Account</RouterLink>
                    <hr />
                    <button @click="logout" class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">Logout</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>