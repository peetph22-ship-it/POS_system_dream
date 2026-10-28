<template>
  <v-container class="py-8">
    <h1 class="text-h5 mb-2">{{ title }}</h1>
    <p class="text-medium-emphasis">{{ description }}</p>
  </v-container>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>
