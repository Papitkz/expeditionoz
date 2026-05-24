import { ref } from 'vue'

export interface UploadResult {
  url: string
  path: string
  type: 'image' | 'video'
  thumbnailUrl?: string
}

export interface GalleryItem {
  id: string
  url: string
  type: 'image' | 'video'
  thumbnailUrl?: string
  caption?: string
  sortOrder: number
}

const CLOUD_NAME = 'dp5uj9tge'
const UPLOAD_PRESET = 'expeditionoz_preset'

export function useStorageUpload() {
  const uploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  function isVideoFile(file: File): boolean {
    return file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|ogv)$/i.test(file.name)
  }

  function getVideoThumbnailUrl(videoUrl: string): string {
    // Cloudinary can generate thumbnails from video
    if (videoUrl.includes('cloudinary.com')) {
      return videoUrl.replace('/upload/', '/upload/so_0,w_400,h_300,c_fill/').replace(/\.[^.]+$/, '.jpg')
    }
    return videoUrl
  }

  async function uploadFile(
    file: File,
    folder: string,
    onProgress?: (pct: number) => void
  ): Promise<UploadResult | null> {
    uploading.value = true
    progress.value = 0
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)
      formData.append('folder', `expeditionoz/${folder}`)
      formData.append('tags', folder)

      const isVideo = isVideoFile(file)
      const resourceType = isVideo ? 'video' : 'image'

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
        { method: 'POST', body: formData }
      )

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error?.message || 'Upload failed')
      }

      const data = await response.json()
      progress.value = 100
      onProgress?.(100)

      const result: UploadResult = {
        url: data.secure_url,
        path: data.public_id,
        type: isVideo ? 'video' : 'image',
      }

      if (isVideo) {
        result.thumbnailUrl = getVideoThumbnailUrl(data.secure_url)
      }

      uploading.value = false
      return result
    } catch (err: any) {
      console.error('Cloudinary upload error:', err)
      error.value = err.message || 'Upload failed'
      uploading.value = false
      return null
    }
  }

  async function uploadImage(
    file: File,
    folder: string,
    onProgress?: (pct: number) => void
  ): Promise<UploadResult | null> {
    return uploadFile(file, folder, onProgress)
  }

  async function uploadVideo(
    file: File,
    folder: string,
    onProgress?: (pct: number) => void
  ): Promise<UploadResult | null> {
    return uploadFile(file, folder, onProgress)
  }

  async function uploadGallery(
    files: File[],
    folder: string,
    onProgress?: (pct: number) => void
  ): Promise<GalleryItem[]> {
    const items: GalleryItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await uploadFile(file, folder)

      if (result) {
        items.push({
          id: `gallery_${Date.now()}_${i}`,
          url: result.url,
          type: result.type,
          thumbnailUrl: result.thumbnailUrl,
          sortOrder: i,
        })
      }

      onProgress?.(Math.round(((i + 1) / files.length) * 100))
    }

    return items
  }

  async function deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
    console.warn('Delete requires backend. Public ID:', publicId, 'Type:', resourceType)
    return false
  }

  return {
    uploading,
    progress,
    error,
    uploadFile,
    uploadImage,
    uploadVideo,
    uploadGallery,
    deleteFile,
    isVideoFile,
    getVideoThumbnailUrl,
  }
}
