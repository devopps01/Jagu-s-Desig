'use client'

import { toast } from 'react-toastify'

export type AdminApiResult<T> = {
  ok: boolean
  status: number
  data: T
  message: string
}

export type AdminApiToastOptions = {
  /** Custom success text. `false` skips success toast. Default: auto for mutations. */
  successMessage?: string | false
  /** Custom error text fallback. */
  errorMessage?: string
  /** Skip all toasts (success + error). */
  silent?: boolean
  /** Skip only success toast (still show errors). Useful for background reloads. */
  silentSuccess?: boolean
}

const messageFrom = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== 'object') return fallback

  const message = (payload as { message?: unknown }).message

  if (typeof message === 'string' && message.trim()) return message.trim()
  if (Array.isArray(message) && message.length) {
    const first = message.find(item => typeof item === 'string' && item.trim())

    if (typeof first === 'string') return first.trim()
  }

  return fallback
}

const defaultSuccessMessage = (method: string) => {
  switch (method) {
    case 'POST':
      return 'Saved successfully'
    case 'PUT':
    case 'PATCH':
      return 'Updated successfully'
    case 'DELETE':
      return 'Deleted successfully'
    default:
      return 'Done'
  }
}

/**
 * Admin fetch with react-toastify on API responses.
 * Mutations (POST/PUT/PATCH/DELETE) toast success + error by default.
 * GET only toasts errors unless you pass a successMessage.
 */
export const adminApi = async <T = unknown>(
  input: string,
  init: RequestInit = {},
  toastOptions: AdminApiToastOptions = {}
): Promise<AdminApiResult<T>> => {
  const method = String(init.method || 'GET').toUpperCase()
  const isMutation = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'

  try {
    const res = await fetch(input, init)
    let data = null as T

    const contentType = res.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      data = (await res.json().catch(() => null)) as T
    } else {
      const text = await res.text().catch(() => '')

      data = (text ? ({ message: text } as unknown as T) : (null as T))
    }

    const message = messageFrom(
      data,
      res.ok
        ? defaultSuccessMessage(method)
        : toastOptions.errorMessage || `Request failed (${res.status})`
    )

    if (!toastOptions.silent) {
      if (!res.ok) {
        toast.error(message || toastOptions.errorMessage || 'Something went wrong')
      } else if (
        toastOptions.successMessage !== false &&
        !toastOptions.silentSuccess &&
        (isMutation || typeof toastOptions.successMessage === 'string')
      ) {
        toast.success(
          typeof toastOptions.successMessage === 'string' ? toastOptions.successMessage : defaultSuccessMessage(method)
        )
      }
    }

    return { ok: res.ok, status: res.status, data, message }
  } catch (error) {
    const message =
      toastOptions.errorMessage ||
      (error instanceof Error && error.message ? error.message : 'Network error. Please try again.')

    if (!toastOptions.silent) toast.error(message)

    return { ok: false, status: 0, data: null as T, message }
  }
}

/** Fire-and-forget mutation with toast + optional reload callback. */
export const adminMutate = async (
  input: string,
  init: RequestInit = {},
  toastOptions: AdminApiToastOptions = {},
  onSuccess?: () => void | Promise<void>
) => {
  const result = await adminApi(input, init, toastOptions)

  if (result.ok && onSuccess) await onSuccess()

  return result
}
