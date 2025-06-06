<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router';
import logo from '@/assets/travelguide-high-resolution-logo-transparent.png';
import { onMounted, ref } from 'vue';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

const isMobileMenuOpen = ref(false);
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
  <nav class="relative bg-purple-700 border-b border-purple-500">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="flex h-20 items-center justify-between">
        <div class="flex flex-1 items-center justify-between">
          <!-- Logo -->
          <RouterLink class="flex flex-shrink-0 items-center mr-3 md:mr-6" :to="isAuthenticated ? '/dashboard' : '/'">
            <img class="h-10 w-auto" :src="logo" alt="Vue Jobs" />
          </RouterLink>

          <!-- Mobile menu button -->
          <div class="md:hidden flex items-center ml-4">
            <button
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              type="button"
              class="inline-flex items-center justify-center p-2 rounded-md text-purple-300 hover:text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span class="sr-only">Open main menu</span>
              <!-- Icon when menu is closed. -->
              <svg
                :class="{ 'hidden': isMobileMenuOpen, 'block': !isMobileMenuOpen }"
                class="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <!-- Icon when menu is open. -->
              <svg
                :class="{ 'hidden': !isMobileMenuOpen, 'block': isMobileMenuOpen }"
                class="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div
            id="mobile-menu"
            :class="{ 'block': isMobileMenuOpen, 'hidden': !isMobileMenuOpen }"
            class="absolute inset-x-0 top-20 z-50 bg-purple-800 shadow-lg
                   md:static md:inset-auto md:top-auto md:z-auto
                   md:bg-transparent md:shadow-none
                   md:flex md:ml-auto md:space-x-4"
          >
            <div class="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 px-4 py-3 md:p-0">
              <RouterLink
                @click="isMobileMenuOpen = false"
                :to="isAuthenticated ? '/dashboard' : '/'"
                :class="[
                  isActiveLink(isAuthenticated ? '/dashboard' : '/')
                    ? 'bg-purple-900 text-white'
                    : 'text-purple-200 hover:bg-purple-700 hover:text-white',
                  'block', 'px-3', 'py-2', 'rounded-md', 'text-base', 'font-medium'
                ]"
              >{{ isAuthenticated ? 'Dashboard' : 'Home' }}</RouterLink>
              <RouterLink
                @click="isMobileMenuOpen = false"
                to="/jobs"
                :class="[
                  isActiveLink('/jobs')
                    ? 'bg-purple-900 text-white'
                    : 'text-purple-200 hover:bg-purple-700 hover:text-white',
                  'block', 'px-3', 'py-2', 'rounded-md', 'text-base', 'font-medium'
                ]"
              >Jobs</RouterLink>
              <RouterLink
                @click="isMobileMenuOpen = false"
                to="/jobs/add"
                v-if="isAuthenticated"
                :class="[
                  isActiveLink('/jobs/add')
                    ? 'bg-purple-900 text-white'
                    : 'text-purple-200 hover:bg-purple-700 hover:text-white',
                  'block', 'px-3', 'py-2', 'rounded-md', 'text-base', 'font-medium'
                ]"
              >Add Job</RouterLink>
              <RouterLink
                @click="isMobileMenuOpen = false"
                to="/login"
                v-if="!isAuthenticated"
                :class="[
                  isActiveLink('/login')
                    ? 'bg-purple-900 text-white'
                    : 'text-purple-200 hover:bg-purple-700 hover:text-white',
                  'block', 'px-3', 'py-2', 'rounded-md', 'text-base', 'font-medium'
                ]"
              >Login</RouterLink>
              <!-- Profile section for mobile dropdown -->
              <div v-if="isAuthenticated" class="md:hidden pt-4 pb-3 border-t border-purple-600">
                <div class="flex items-center px-2">
                  <div class="flex-shrink-0">
                    <img :src="userProfile.profilePicture" alt="Profile" class="h-10 w-10 rounded-full" />
                  </div>
                  <div class="ml-3">
                    <div class="text-base font-medium leading-none text-white">{{ userProfile.name }}</div>
                  </div>
                </div>
                <div class="mt-3 space-y-1">
                  <RouterLink @click="isMobileMenuOpen = false" to="/profile" class="block px-3 py-2 rounded-md text-base font-medium text-purple-200 hover:bg-purple-700 hover:text-white">Profile</RouterLink>
                  <RouterLink @click="isMobileMenuOpen = false" to="/settings" class="block px-3 py-2 rounded-md text-base font-medium text-purple-200 hover:bg-purple-700 hover:text-white">Settings</RouterLink>
                  <button @click="() => { logout(); isMobileMenuOpen = false; }" class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-purple-200 hover:bg-purple-700 hover:text-white">Logout</button>
                </div>
              </div>
              <!-- Original Profile dropdown for desktop (remains part of the md:flex flow) -->
              <div v-if="isAuthenticated" class="hidden md:relative md:flex md:items-center">
                <img :src="userProfile.profilePicture" alt="Profile" class="h-8 w-8 rounded-full mr-2" />
                <div class="relative">
                  <button @click="isDropdownOpen = !isDropdownOpen" class="text-white px-3 py-2 rounded-md focus:outline-none">
                    <i class="pi pi-cog"></i>
                  </button>
                  <div v-if="isDropdownOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-20">
                    <RouterLink to="/profile" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">Profile</RouterLink>
                    <RouterLink to="/settings" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">Settings</RouterLink>
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
