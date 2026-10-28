// $fetch preconfigured for the POS API: base URL and cookies.
// Usage: const api = useApi(); const items = await api<MenuItem[]>('/api/v1/menu')
export function useApi() {
  const config = useRuntimeConfig()

  return $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include'
  })
}
