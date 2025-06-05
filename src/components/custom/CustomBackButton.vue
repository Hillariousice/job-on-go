<script setup lang="ts">
import { useRouter } from 'vue-router';

const props = defineProps<{
  to?: string;
}>();

const router = useRouter();

const goBack = () => {
  if (props.to) {
    router.push(props.to);
  } else {
    router.go(-1);
  }
};
</script>

<template>
  <section>
    <div class="container m-auto py-6 px-6">
      <button
        @click="goBack"
        class="text-green-500 hover:text-green-600 flex items-center focus:outline-none"
      >
        <i class="pi pi-arrow-circle-left mr-3"></i> Back
      </button>
    </div>
  </section>
</template>