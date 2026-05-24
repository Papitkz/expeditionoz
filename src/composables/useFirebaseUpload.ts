import { ref } from 'vue'
import { getFirebaseStorage } from '@/lib/firebase'
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'

interface UploadResult {
  url: string
  path: string
}

export function useFirebaseUpload() {
  const uploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  async function uploadImage(
    file: File,
    sectionKey: string,
    onProgress?: (pct: number) => void
  ): Promise<UploadResult | null> {
    uploading.value = true
    progress.value = 0
    error.value = null

    try {
      const storage = getFirebaseStorage()
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `cms/${sectionKey}/${timestamp}_${safeName}`
      const fileRef = storageRef(storage, filePath)

      await uploadBytes(fileRef, file, {
        customMetadata: { sectionKey, uploadedAt: new Date().toISOString() },
      })

      progress.value = 100
      onProgress?.(100)

      const url = await getDownloadURL(fileRef)
      uploading.value = false
      return { url, path: filePath }
    } catch (err: any) {
      error.value = err.message || 'Upload failed'
      uploading.value = false
      return null
    }
  }

  async function deleteImage(filePath: string): Promise<boolean> {
    try {
      const storage = getFirebaseStorage()
      const fileRef = storageRef(storage, filePath)
      await deleteObject(fileRef)
      return true
    } catch {
      return false
    }
  }

  return { uploading, progress, error, uploadImage, deleteImage }
}
