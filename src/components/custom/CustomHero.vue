<script setup lang="ts">
import { defineProps } from 'vue';

defineProps({
  title: {
    type: String,
    default: 'Become a Frontend Developer',
  },
  subtitle: {
    type: String,
    default: 'Find the various frontend jobs that fit your skills and needs',
  },
  button: {
    type: Object,
    default: () => ({
      text: 'Get Started as a Developer',
      route: '/signup',
    }),
  },
  buttonCom: {
    type: Object,
    default: () => ({
      text: 'Get Started as a Company',
      route: '/company_signup',
    }),
  },
});
</script>

<template>
  <section class="bg-purple-700 py-20 mb-4">
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center"
    >
      <div class="text-center">
        <h1 class="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
          {{ title }}
        </h1>
        <p class="my-4 text-xl text-white">
          {{ subtitle }}
        </p>
        <div class="flex flex-col sm:flex-row sm:justify-center w-full items-center">
          <router-link
            :to="button.route"
            class="bg-white text-purple-700 font-bold p-2 rounded-full hover:bg-purple-100 transition duration-200 w-full sm:w-auto text-center mb-4 sm:mb-0"
          >
            {{ button.text }}
          </router-link>
          <router-link
            :to="buttonCom.route"
            class="bg-white text-purple-700 font-bold p-2 rounded-full hover:bg-purple-100 transition duration-200 w-full sm:w-auto text-center sm:ml-4"
          >
            {{ buttonCom.text }}
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>
