<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router';
import logo from '@/assets/travelguide-high-resolution-logo-transparent.png';
import { onMounted, ref } from 'vue';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

const isAuthenticated = ref(false);
const userProfile = ref({
  name: "",
  profilePicture: ""
});

const router = useRouter();
const isDropdownOpen = ref(false);

const auth = getAuth();  // Initialize Firebase Auth

// Check if the current route is active
const isActiveLink = (routePath: string) => {
  const route = useRoute();
  return route.path === routePath;
};

// Check the authentication state using Firebase
const checkAuth = () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isAuthenticated.value = true;
      userProfile.value = {
        name: user.displayName || "User",
        profilePicture: user.photoURL || "https://via.placeholder.com/150"
      };
    } else {
      isAuthenticated.value = false;
      userProfile.value = { name: "", profilePicture: "" };
    }
  });
};

// Logout function using Firebase
const logout = () => {
  signOut(auth).then(() => {
    isAuthenticated.value = false;
    userProfile.value = { name: "", profilePicture: "" };
    router.push('/login');
  }).catch((error) => {
    console.error("Error logging out:", error);
  });
};

// Run onMounted lifecycle hook to check auth
onMounted(() => {
  checkAuth();
});
</script>

<template>
  <nav class="bg-purple-700 border-b border-purple-500">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="flex h-20 items-center justify-between">
        <div class="flex flex-1 items-center justify-center md:items-stretch md:justify-start">
          <!-- Logo -->
          <RouterLink class="flex flex-shrink-0 items-center mr-6" :to="isAuthenticated ? '/dashboard' : '/'">
            <img class="h-10 w-auto" :src="logo" alt="Vue Jobs" />
          </RouterLink>
          <div class="md:ml-auto flex space-x-4">
            <div class="flex space-x-2">
              <RouterLink
                :to="isAuthenticated ? '/dashboard' : '/'"
                :class="[
                  isActiveLink(isAuthenticated ? '/dashboard' : '/')
                    ? 'bg-purple-900'
                    : 'hover:bg-gray-900 hover:text-white',
                  'text-white', 'px-3', 'py-2', 'rounded-md',
                ]"
              >{{ isAuthenticated ? 'Dashboard' : 'Home' }}</RouterLink>
              <RouterLink
                to="/jobs"
                :class="[
                  isActiveLink('/jobs')
                    ? 'bg-purple-900'
                    : 'hover:bg-gray-900 hover:text-white',
                  'text-white', 'px-3', 'py-2', 'rounded-md',
                ]"
              >Jobs</RouterLink>
              <RouterLink
                to="/jobs/add"
                v-if="isAuthenticated"
                :class="[
                  isActiveLink('/jobs/add')
                    ? 'bg-purple-900'
                    : 'hover:bg-gray-900 hover:text-white',
                  'text-white', 'px-3', 'py-2', 'rounded-md',
                ]"
              >Add Job</RouterLink>
              <RouterLink
                to="/login"
                v-if="!isAuthenticated"
                :class="[
                  isActiveLink('/login')
                    ? 'bg-purple-900'
                    : 'hover:bg-gray-900 hover:text-white',
                  'text-white', 'px-3', 'py-2', 'rounded-md',
                ]"
              >Login</RouterLink>
              <div v-if="isAuthenticated" class="relative flex items-center">
                <img :src="userProfile.profilePicture" alt="Profile" class="h-8 w-8 rounded-full mr-2" />
                <div class="relative">
                  <button @click="isDropdownOpen = !isDropdownOpen" class="text-white px-3 py-2 rounded-md focus:outline-none">
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
