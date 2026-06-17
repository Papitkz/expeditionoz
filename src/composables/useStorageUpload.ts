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

const CLOUD_NAME = 'drsj5nhhu'
const UPLOAD_PRESET = 'expeditionoz'

// Cloudinary free plan hard limit is 10MB — we target 9MB to stay safely under
const MAX_FILE_SIZE = 9 * 1024 * 1024   // 9MB (safe limit for Cloudinary free)
const MAX_IMAGE_SIZE = 9 * 1024 * 1024  // 9MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB

export function useStorageUpload() {
  const uploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  function isVideoFile(file: File): boolean {
    return file.type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv|ogv)$/i.test(file.name)
  }

  function getVideoThumbnailUrl(videoUrl: string): string {
    if (videoUrl.includes('cloudinary.com')) {
      return videoUrl
        .replace('/upload/', '/upload/so_0,w_400,h_300,c_fill/')
        .replace(/\.[^.]+$/, '.jpg')
    }
    return videoUrl
  }

  /**
   * Compress image before upload.
   * Targets maxSizeMB (default 9MB) to stay under Cloudinary's 10MB free plan limit.
   * Scales down dimensions aggressively for very large files.
   */
  async function compressImage(file: File, maxSizeMB: number = 9): Promise<File> {
    const maxSizeBytes = maxSizeMB * 1024 * 1024

    // Already under limit — return as-is
    if (file.size <= maxSizeBytes) return file

    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)

        let { width, height } = img

        // More aggressive scaling for very large files
        const fileSizeMB = file.size / 1024 / 1024
        const maxDimension =
          fileSizeMB > 30 ? 1024
          : fileSizeMB > 20 ? 1280
          : fileSizeMB > 10 ? 1600
          : 1920

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        const tryCompress = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'))
                return
              }

              if (blob.size <= maxSizeBytes || quality <= 0.1) {
                resolve(
                  new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  })
                )
              } else {
                // Step down quality until it fits
                tryCompress(Math.max(quality - 0.1, 0.1))
              }
            },
            'image/jpeg',
            quality
          )
        }

        // Start at 0.85 — more aggressive than before for large files
        tryCompress(0.85)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image for compression'))
      }

      img.src = url
    })
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
      const isVideo = isVideoFile(file)
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE

      let fileToUpload = file

      if (!isVideo) {
        // Always attempt compression for images — targets 9MB
        fileToUpload = await compressImage(file, 9)

        // If still over limit after compression, reject
        if (fileToUpload.size > maxSize) {
          const sizeMB = (fileToUpload.size / 1024 / 1024).toFixed(2)
          throw new Error(
            `Image too large (${sizeMB}MB) even after compression. Please use a smaller or lower-resolution image.`
          )
        }
      } else {
        // Videos: no client-side compression, reject if too large
        if (file.size > maxSize) {
          const sizeMB = (file.size / 1024 / 1024).toFixed(2)
          const limitMB = (maxSize / 1024 / 1024).toFixed(0)
          throw new Error(
            `Video too large (${sizeMB}MB). Maximum allowed is ${limitMB}MB.`
          )
        }
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('upload_preset', UPLOAD_PRESET)
      formData.append('folder', `expeditionoz/${folder}`)
      formData.append('tags', folder)

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

  async function deleteFile(
    publicId: string,
    resourceType: 'image' | 'video' = 'image'
  ): Promise<boolean> {
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
    compressImage,
  }
}