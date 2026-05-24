import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

interface UploadResult {
  url: string
  path: string
}

export function useSupabaseUpload() {
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
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${sectionKey}/${timestamp}_${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('cms-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      progress.value = 100
      onProgress?.(100)

      const { data: urlData } = supabase.storage
        .from('cms-uploads')
        .getPublicUrl(filePath)

      uploading.value = false
      return { url: urlData.publicUrl, path: filePath }
    } catch (err: any) {
      error.value = err.message || 'Upload failed'
      uploading.value = false
      return null
    }
  }

  async function deleteImage(filePath: string): Promise<boolean> {
    try {
      const { error: deleteError } = await supabase.storage
        .from('cms-uploads')
        .remove([filePath])
      if (deleteError) throw deleteError
      return true
    } catch {
      return false
    }
  }

  return { uploading, progress, error, uploadImage, deleteImage }
}
