<script setup lang="ts">
import CustomBackButton from '@/components/custom/CustomBackButton.vue';
import ChatbotInterface from '@/components/chatbot/ChatbotInterface.vue'; // Import the ChatbotInterface
</script>

<template>
  <CustomBackButton to="/settings" />
  <section class="container mx-auto p-4 py-6">
    <h1 class="text-3xl font-bold text-center mb-8 text-purple-700">Help & Support</h1>

    <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div class="mb-6 text-center">
        <p class="text-lg text-gray-700">
          Have questions or need assistance? Try our support bot below.
        </p>
        <!-- "Coming soon" message removed -->
      </div>

      <!-- ChatbotInterface Integration -->
      <div class="my-6"> {/* Added my-6 for spacing around the chatbot */}
        <ChatbotInterface />
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
