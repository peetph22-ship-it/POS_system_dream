<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <v-card max-width="420" class="pa-6 text-center" elevation="2">
      <v-icon icon="mdi-silverware-fork-knife" size="48" color="primary" />
      <h1 class="text-h5 mt-4">POS Dream</h1>
      <p class="text-medium-emphasis mt-2">
        API: {{ status }}
      </p>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()

const { data, error } = await useFetch<{ status: string }>('/health', {
  baseURL: config.public.apiBase,
  server: false
})

const status = computed(() => {
  if (error.value) return 'offline'
  return data.value?.status ?? 'checking...'
})
</script>
