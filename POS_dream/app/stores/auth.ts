import { defineStore } from 'pinia'

export interface AuthUser {
  id: number
  displayName: string
  role: string
}

// Signed-in staff member. Fill in login/logout once the auth API exists.
export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const isLoggedIn = computed(() => user.value !== null)

  function setUser(value: AuthUser | null) {
    user.value = value
  }

  return { user, isLoggedIn, setUser }
})
