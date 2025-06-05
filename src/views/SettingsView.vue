<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <section class="container mx-auto p-4 py-6">
    <h1 class="text-3xl font-bold text-center mb-8 text-purple-700">Settings</h1>

    <div class="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <nav class="space-y-4">
        <div>
          <RouterLink
            to="/settings/change-password"
            class="block w-full text-left px-4 py-3 text-lg text-gray-700 hover:bg-purple-100 hover:text-purple-700 rounded-md transition-colors duration-150"
          >
            <i class="pi pi-lock mr-3"></i>Change Password
          </RouterLink>
        </div>
        <div>
          <RouterLink
            to="/settings/help"
            class="block w-full text-left px-4 py-3 text-lg text-gray-700 hover:bg-purple-100 hover:text-purple-700 rounded-md transition-colors duration-150"
          >
            <i class="pi pi-question-circle mr-3"></i>Help
          </RouterLink>
        </div>
        <div>
          <RouterLink
            to="/settings/manage-account"
            class="block w-full text-left px-4 py-3 text-lg text-gray-700 hover:bg-purple-100 hover:text-purple-700 rounded-md transition-colors duration-150"
          >
            <i class="pi pi-cog mr-3"></i>Manage Account
          </RouterLink>
        </div>
      </nav>
    </div>
  </section>
</template>
