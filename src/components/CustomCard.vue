<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps({
  bg: {
    type: String,
    default: 'bg-gray-100',
  },
});
</script>

<template>
  <div :class="`${props.bg} p-6 rounded-lg shadow-md`">
    <slot></slot>
  </div>
</template>


