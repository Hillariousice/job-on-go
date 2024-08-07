<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
  job: {
    type: Object,
    default: () => ({
      type: '',
      title: '',
      description: '',
      salary: '',
      location: '',
      id: ''
    })
  },
});

const showFullDescription = ref(false);

const toggleFullDescription = () => {
  showFullDescription.value = !showFullDescription.value;
};

const truncatedDescription = computed(() => {
  let description = props.job?.description || '';
  if (!showFullDescription.value) {
    description = description.substring(0, 90) + '...';
  }
  return description;
});
</script>

<template>
  <div class="bg-white rounded-xl shadow-md relative">
    <div class="p-4">
      <div class="mb-6">
        <div class="text-gray-600 my-2">{{ props.job.type }}</div>
        <h3 class="text-xl font-bold">{{ props.job.title }}</h3>
      </div>

      <div class="mb-5">
        <div>
          {{ truncatedDescription }}
        </div>
        <button
          @click="toggleFullDescription"
          class="text-purple-500 hover:text-purple-600 mb-5"
        >
          {{ showFullDescription ? 'Less' : 'More' }}
        </button>
      </div>

      <h3 class="text-purple-500 mb-2">{{ props.job.salary }} / Year</h3>

      <div class="border border-gray-100 mb-5"></div>

      <div class="flex flex-col lg:flex-row justify-between mb-4">
        <div class="text-orange-700 mb-3">
          <i class="pi pi-map-marker text-orange-700"></i>
          {{ props.job.location }}
        </div>
        <RouterLink
          :to="'/jobs/' + props.job.id"
          class="h-[36px] bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-center text-sm"
        >
          Read More
        </RouterLink>
      </div>
    </div>
  </div>
</template>
