<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const messages = ref<Message[]>([]);
const userInput = ref('');
const isLoading = ref(false);
const currentUserUID = ref<string | null>(null); // Can also be a generated unique ID if user is not logged in
const chatContainerRef = ref<HTMLDivElement | null>(null);
const auth = getAuth();

// Set up auth state listener
onMounted(() => {
  onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      currentUserUID.value = user.uid;
    } else {
      currentUserUID.value = null; // Or generate a persistent anonymous ID here
    }
  });
});

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
};

const addMessage = (text: string, sender: 'user' | 'bot') => {
  messages.value.push({
    id: Date.now().toString() + Math.random().toString(36).substring(2,9), // Simple unique ID
    text,
    sender,
    timestamp: new Date(),
  });
  scrollToBottom();
};

const sendMessage = async () => {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  const currentQuery = userInput.value;
  userInput.value = ''; // Clear input immediately
  isLoading.value = true;

  // --- IMPORTANT: Replace with your actual Cloud Function URL ---
  // This URL should point to the 'dialogflowProxy' function you deployed.
  // Example: "https://us-central1-your-project-id.cloudfunctions.net/dialogflowProxy"
  const cloudFunctionUrl = 'YOUR_CLOUD_FUNCTION_URL_HERE/dialogflowProxy'; // <<<< REPLACE THIS
  // --- END OF PLACEHOLDER SECTION ---

  if (cloudFunctionUrl.includes('YOUR_CLOUD_FUNCTION_URL_HERE')) {
     console.warn("ChatbotInterface: Cloud Function URL is a placeholder. Chatbot will not connect.");
     addMessage("Chatbot is not configured. Please tell the administrator to set the Cloud Function URL.", 'bot');
     isLoading.value = false;
     return;
  }

  try {
    const sessionId = currentUserUID.value || 'anonymous_chat_session_' + Date.now(); // Use UID or generate session ID
    const response = await fetch(cloudFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queryText: currentQuery,
        sessionId: sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Network response was not ok: ${response.status}. ${errorData?.error || errorData?.message || ''}`);
    }

    const data = await response.json();
    if (data.fulfillmentText) {
      addMessage(data.fulfillmentText, 'bot');
    } else {
      addMessage("I'm sorry, I didn't get a response. Please try again.", 'bot');
    }
  } catch (error) {
    console.error('Error sending message to Dialogflow proxy:', error);
    addMessage(`Error: ${(error as Error).message || "Could not connect to the bot."}`, 'bot');
  } finally {
    isLoading.value = false;
    scrollToBottom(); // Ensure scroll after bot message or error
  }
};

const formatTimestamp = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<template>
  <div class="flex flex-col h-[500px] max-w-md mx-auto bg-white shadow-xl rounded-lg border border-gray-200">
    <!-- Header -->
    <div class="bg-purple-600 text-white p-3 rounded-t-lg">
      <h3 class="text-lg font-semibold text-center">Chat with Support Bot</h3>
    </div>

    <!-- Message Display Area -->
    <div ref="chatContainerRef" class="flex-grow p-4 space-y-3 overflow-y-auto bg-gray-50">
      <div v-for="message in messages" :key="message.id" class="flex" :class="{ 'justify-end': message.sender === 'user' }">
        <div
          class="p-2.5 rounded-xl max-w-[75%]"
          :class="{
            'bg-purple-500 text-white': message.sender === 'user',
            'bg-gray-200 text-gray-800': message.sender === 'bot',
          }"
        >
          <p class="text-sm">{{ message.text }}</p>
          <p class="text-xs mt-1" :class="message.sender === 'user' ? 'text-purple-200 text-right' : 'text-gray-500 text-left'">
            {{ formatTimestamp(message.timestamp) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading Indicator -->
    <div v-if="isLoading" class="p-3 text-sm text-gray-500 italic text-center border-t border-gray-200">
      Bot is typing...
    </div>

    <!-- Input Area -->
    <form @submit.prevent="sendMessage" class="p-3 border-t border-gray-200 bg-gray-100 rounded-b-lg">
      <div class="flex items-center">
        <input
          type="text"
          v-model="userInput"
          placeholder="Type your message..."
          class="flex-grow p-2.5 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          :disabled="isLoading"
        />
        <button
          type="submit"
          class="bg-purple-600 text-white p-2.5 rounded-r-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 disabled:opacity-50"
          :disabled="isLoading || userInput.trim() === ''"
        >
          Send
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Ensure smooth scrolling */
.overflow-y-auto {
  scroll-behavior: smooth;
}
/* Hide scrollbar for chat container if desired, but still scrollable */
/* For Webkit browsers */
/*
.overflow-y-auto::-webkit-scrollbar {
  display: none;
}
*/
/* For IE, Edge, Firefox */
/*
.overflow-y-auto {
  -ms-overflow-style: none; IE and Edge
  scrollbar-width: none; Firefox
}
*/
</style>
