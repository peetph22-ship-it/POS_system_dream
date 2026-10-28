<template>
  <v-container class="py-8">
    <div class="d-flex align-center ga-3 mb-6">
      <h1 class="text-h5">หน้าหลัก</h1>
      <v-chip :color="apiStatus.color" size="small" variant="tonal">
        API: {{ apiStatus.label }}
      </v-chip>
    </div>

    <v-row>
      <v-col v-for="item in shortcuts" :key="item.to" cols="6" md="3">
        <v-card :to="item.to" class="pa-6 text-center" variant="outlined">
          <v-icon :icon="item.icon" size="40" color="primary" />
          <div class="text-subtitle-1 mt-3">{{ item.title }}</div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { HealthResponse } from '~/types/api'

const shortcuts = navItems.filter((item) => item.to !== '/')

const api = useApi()
const { data, error, pending } = useAsyncData('health-ready', () => api<HealthResponse>('/health/ready'))

const apiStatus = computed(() => {
  if (pending.value) return { label: 'checking...', color: 'secondary' }
  if (error.value) return { label: 'offline', color: 'error' }
  if (data.value?.database !== 'ok') return { label: 'database unreachable', color: 'warning' }
  return { label: 'ok', color: 'success' }
})
</script>
