import { ref, readonly } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  const add = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const toast = { id: ++nextId, message, type }
    toasts.value.push(toast)
    if (duration > 0) {
      setTimeout(() => remove(toast.id), duration)
    }
  }

  const remove = (toastId: number) => {
    toasts.value = toasts.value.filter(t => t.id !== toastId)
  }

  const clear = () => {
    toasts.value = []
  }

  return {
    toasts: readonly(toasts),
    success: (msg: string, duration?: number) => add(msg, 'success', duration),
    error: (msg: string, duration?: number) => add(msg, 'error', duration),
    info: (msg: string, duration?: number) => add(msg, 'info', duration),
    warning: (msg: string, duration?: number) => add(msg, 'warning', duration),
    remove,
    clear
  }
}