import { FetchError } from 'ofetch'

import type { ApiErrorBody } from '~/types/api'

// Message to show the user for a failed API call, preferring the backend's own message.
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    const body = error.data as ApiErrorBody | undefined
    if (body?.message) return body.message
    if (!error.response) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
  }
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}
