<script setup lang="ts">
import CustomBackButton from '@/components/custom/CustomBackButton.vue';
</script>

<template>
  <CustomBackButton to="/settings" />
  <section class="container mx-auto p-4 py-6">
    <h1 class="text-3xl font-bold text-center mb-8 text-purple-700">Help & Support</h1>

    <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div class="mb-6 text-center">
        <p class="text-lg text-gray-700">
          Have questions or need assistance?
        </p>
        <p class="text-sm text-purple-600 mt-1">
          Our live chat feature is coming soon!
        </p>
      </div>

      <!-- Placeholder Chat UI -->
      <div class="border border-gray-300 rounded-lg p-4 h-96 flex flex-col">
        <!-- Message Display Area -->
        <div class="flex-grow space-y-4 overflow-y-auto mb-4 pr-2">
          <!-- Example Support Message -->
          <div class="flex items-start space-x-2">
            <span class="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm">S</span>
            <div class="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-xs shadow">
              <p class="text-sm">Hello! How can we help you today?</p>
            </div>
          </div>
          <!-- Example User Message -->
          <div class="flex items-start justify-end space-x-2">
            <div class="bg-purple-500 text-white p-3 rounded-lg max-w-xs shadow">
              <p class="text-sm">I have an issue with my account settings.</p>
            </div>
            <span class="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm">U</span>
          </div>
          <!-- Example Support Message -->
           <div class="flex items-start space-x-2">
            <span class="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm">S</span>
            <div class="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-xs shadow">
              <p class="text-sm">I understand. Could you please provide more details? In the meantime, our live chat is coming soon.</p>
            </div>
          </div>
        </div>

        <!-- Message Input Area -->
        <div class="mt-auto flex items-center pt-4 border-t border-gray-200">
          <input
            type="text"
            placeholder="Live chat coming soon..."
            disabled
            class="w-full px-4 py-3 border border-gray-300 rounded-l-md focus:outline-none bg-gray-100 text-sm"
          />
          <button
            disabled
            class="bg-purple-300 text-white px-6 py-3 rounded-r-md cursor-not-allowed text-sm"
          >
            Send
          </button>
        </div>
      </div>

      <div class="mt-8 text-center">
        <p class="text-gray-600">
          For urgent matters or if you prefer, please email us at:
          <a href="mailto:support@example.com" class="text-purple-600 hover:underline font-medium">support@example.com</a>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Custom scrollbar for chat (optional) */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #c4b5fd; /* purple-300 */
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background-color: #f3e8ff; /* purple-50 */
}
</style>
