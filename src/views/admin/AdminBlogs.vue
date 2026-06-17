<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getFirebaseDb, initFirebase } from '@/lib/firebase'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { useStorageUpload } from '@/composables/useStorageUpload'
import { useToast } from '@/composables/useToast'

export interface GalleryItem {
  id: string
  url: string
  type: 'image' | 'video'
  thumbnailUrl?: string
  caption?: string
  sortOrder: number
}

interface Blog {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImageUrl: string
  coverVideoUrl: string
  authorName: string
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  gallery: GalleryItem[]
}

const blogs = ref<Blog[]>([])
const selectedBlog = ref<Blog | null>(null)
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const creating = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const newBlog = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImageUrl: '',
  coverVideoUrl: '',
  authorName: 'Expedition OZ',
  gallery: [] as GalleryItem[]
})

const galleryFileInput = ref<HTMLInputElement | null>(null)
const galleryLoading = ref(false)

const { uploadFile, uploadGallery, isVideoFile, uploading, progress } = useStorageUpload()
const toast = useToast()

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function loadBlogs() {
  initFirebase()
  loading.value = true
  try {
    const db = getFirebaseDb()
    const snap = await getDocs(query(collection(db, 'cms_blogs'), orderBy('createdAt', 'desc')))
    blogs.value = snap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        slug: data.slug || '',
        title: data.title || '',
        excerpt: data.excerpt || '',
        content: data.content || '',
        coverImageUrl: data.coverImageUrl || '',
        coverVideoUrl: data.coverVideoUrl || '',
        authorName: data.authorName || 'Expedition OZ',
        isPublished: data.isPublished || false,
        publishedAt: data.publishedAt || null,
        createdAt: data.createdAt || new Date().toISOString(),
        gallery: (data.gallery || []).sort((a: GalleryItem, b: GalleryItem) => a.sortOrder - b.sortOrder),
      } as Blog
    })
  } catch (e) {
    console.warn('Firestore unavailable, cannot load blogs:', e)
    blogs.value = []
  }
  loading.value = false
}

async function selectBlog(blog: Blog) {
  selectedBlog.value = { ...blog, gallery: [...(blog.gallery || [])] }
  editing.value = false
  creating.value = false
}

async function handleCoverUpload(event: Event, isNew: boolean) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  saving.value = true
  const result = await uploadFile(file, `blog_cover_${Date.now()}`)
  if (result) {
    if (isNew) {
      if (result.type === 'video') {
        newBlog.value.coverVideoUrl = result.url
      } else {
        newBlog.value.coverImageUrl = result.url
      }
    } else if (selectedBlog.value) {
      if (result.type === 'video') {
        selectedBlog.value.coverVideoUrl = result.url
      } else {
        selectedBlog.value.coverImageUrl = result.url
      }
    }
    toast.success(result.type === 'video' ? 'Cover video uploaded!' : 'Cover image uploaded!')
  } else {
    toast.error('Upload failed')
  }
  saving.value = false
  target.value = ''
}

async function handleGalleryUpload(event: Event, isNew: boolean) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (!files.length) return

  galleryLoading.value = true
  const folder = `blog_gallery_${Date.now()}`
  const results = await uploadGallery(files, folder, (pct) => {
    progress.value = pct
  })

  if (results.length) {
    if (isNew) {
      newBlog.value.gallery.push(...results)
    } else if (selectedBlog.value) {
      selectedBlog.value.gallery.push(...results)
    }
    toast.success(`${results.length} item(s) added to gallery!`)
  } else {
    toast.error('Gallery upload failed')
  }

  galleryLoading.value = false
  target.value = ''
}

function removeGalleryItem(index: number, isNew: boolean) {
  if (isNew) {
    newBlog.value.gallery.splice(index, 1)
  } else if (selectedBlog.value) {
    selectedBlog.value.gallery.splice(index, 1)
  }
}

function moveGalleryItem(index: number, direction: 'up' | 'down', isNew: boolean) {
  const gallery = isNew ? newBlog.value.gallery : selectedBlog.value?.gallery
  if (!gallery) return

  if (direction === 'up' && index > 0) {
    const temp = gallery[index]
    gallery[index] = gallery[index - 1]
    gallery[index - 1] = temp
  } else if (direction === 'down' && index < gallery.length - 1) {
    const temp = gallery[index]
    gallery[index] = gallery[index + 1]
    gallery[index + 1] = temp
  }
}

function updateGalleryCaption(index: number, caption: string, isNew: boolean) {
  const gallery = isNew ? newBlog.value.gallery : selectedBlog.value?.gallery
  if (gallery && gallery[index]) {
    gallery[index].caption = caption
  }
}

async function createBlog() {
  if (!newBlog.value.title.trim()) return
  saving.value = true
  const db = getFirebaseDb()
  const slug = newBlog.value.slug || generateSlug(newBlog.value.title)

  const galleryData = newBlog.value.gallery.map((item, idx) => ({
    ...item,
    sortOrder: idx,
  }))

  const ref = await addDoc(collection(db, 'cms_blogs'), {
    slug,
    title: newBlog.value.title,
    excerpt: newBlog.value.excerpt,
    content: newBlog.value.content,
    coverImageUrl: newBlog.value.coverImageUrl,
    coverVideoUrl: newBlog.value.coverVideoUrl,
    authorName: newBlog.value.authorName,
    gallery: galleryData,
    isPublished: false,
    publishedAt: null,
    createdAt: new Date().toISOString(),
  })

  blogs.value.unshift({
    id: ref.id,
    slug,
    title: newBlog.value.title,
    excerpt: newBlog.value.excerpt,
    content: newBlog.value.content,
    coverImageUrl: newBlog.value.coverImageUrl,
    coverVideoUrl: newBlog.value.coverVideoUrl,
    authorName: newBlog.value.authorName,
    isPublished: false,
    publishedAt: null,
    createdAt: new Date().toISOString(),
    gallery: galleryData,
  })

  selectedBlog.value = blogs.value[0]
  creating.value = false
  newBlog.value = { title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', coverVideoUrl: '', authorName: 'Expedition OZ', gallery: [] }
  showMessage('Blog post created', 'success')
  saving.value = false
}

async function saveBlog() {
  if (!selectedBlog.value) return
  saving.value = true
  const db = getFirebaseDb()
  const { id, ...updates } = selectedBlog.value

  // Normalize gallery sortOrder
  const galleryData = (updates.gallery || []).map((item, idx) => ({
    ...item,
    sortOrder: idx,
  }))
  updates.gallery = galleryData

  await updateDoc(doc(db, 'cms_blogs', id), updates)
  showMessage('Blog saved', 'success')
  editing.value = false
  await loadBlogs()
  saving.value = false
}

async function togglePublished() {
  if (!selectedBlog.value) return
  const db = getFirebaseDb()
  const newVal = !selectedBlog.value.isPublished
  const updates: any = { isPublished: newVal }
  if (newVal && !selectedBlog.value.publishedAt) updates.publishedAt = new Date().toISOString()

  await updateDoc(doc(db, 'cms_blogs', selectedBlog.value.id), updates)
  selectedBlog.value.isPublished = newVal
  if (newVal) selectedBlog.value.publishedAt = updates.publishedAt
  showMessage(newVal ? 'Published' : 'Unpublished', 'success')
  await loadBlogs()
}

async function deleteBlog() {
  if (!selectedBlog.value || !confirm('Delete this blog post?')) return
  const db = getFirebaseDb()
  await deleteDoc(doc(db, 'cms_blogs', selectedBlog.value.id))
  blogs.value = blogs.value.filter(b => b.id !== selectedBlog.value!.id)
  selectedBlog.value = null
  showMessage('Blog deleted', 'success')
}

function startCreating() {
  creating.value = true
  selectedBlog.value = null
  editing.value = false
}

onMounted(loadBlogs)
</script>

<template>
  <div class="blogs-manager">
    <div v-if="message" class="alert" :class="`alert-${messageType}`">{{ message }}</div>

    <div class="manager-grid">
      <div class="blog-list">
        <div class="list-header">
          <h3 class="list-title">Blog Posts</h3>
          <button @click="startCreating" class="new-btn">+ New</button>
        </div>
        <div v-if="loading" class="loading-state">Loading...</div>
        <div v-else class="blogs-scroll">
          <button
            v-for="blog in blogs"
            :key="blog.id"
            @click="selectBlog(blog)"
            class="blog-item"
            :class="{ 'blog-selected': selectedBlog?.id === blog.id }"
          >
            <div class="blog-thumb" v-if="blog.coverImageUrl">
              <img :src="blog.coverImageUrl" :alt="blog.title" />
            </div>
            <div v-else-if="blog.coverVideoUrl" class="blog-thumb video-thumb">
              <video :src="blog.coverVideoUrl" muted />
              <div class="video-badge">VIDEO</div>
            </div>
            <div class="blog-meta">
              <p class="blog-title-text">{{ blog.title }}</p>
              <p class="blog-date">{{ new Date(blog.createdAt).toLocaleDateString() }}</p>
              <span class="blog-status" :class="blog.isPublished ? 'status-published' : 'status-draft'">
                {{ blog.isPublished ? 'Published' : 'Draft' }}
              </span>
              <span v-if="blog.gallery?.length" class="gallery-badge">
                {{ blog.gallery.length }} media
              </span>
            </div>
          </button>
        </div>
      </div>

      <div class="blog-editor">
        <!-- Create New Blog -->
        <div v-if="creating" class="editor-content">
          <h3 class="editor-title">New Blog Post</h3>
          <div class="form-grid">
            <div class="form-group col-span-2">
              <label class="form-label">Title</label>
              <input v-model="newBlog.title" class="form-input" placeholder="Blog post title" @input="newBlog.slug = generateSlug(newBlog.title)" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Slug</label>
              <input v-model="newBlog.slug" class="form-input" placeholder="url-slug" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Excerpt</label>
              <textarea v-model="newBlog.excerpt" class="form-input" rows="2" placeholder="Brief summary..."></textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Content</label>
              <textarea v-model="newBlog.content" class="form-input content-area" rows="10" placeholder="Full blog post content..."></textarea>
            </div>

            <!-- Cover Image/Video Upload -->
            <div class="form-group col-span-2">
              <label class="form-label">Cover Media (Image or Video)</label>
              <div class="media-upload-row">
                <input v-model="newBlog.coverImageUrl" class="form-input" placeholder="Image URL..." />
                <input v-model="newBlog.coverVideoUrl" class="form-input" placeholder="Video URL..." />
                <input
                  :id="'new-cover-upload'"
                  type="file"
                  accept="image/*,video/*"
                  class="file-input"
                  @change="(e) => handleCoverUpload(e, true)"
                />
                <label :for="'new-cover-upload'" class="upload-btn" :class="{ uploading: saving }">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {{ saving ? '...' : 'Up' }}
                </label>
              </div>
            </div>

            <!-- Cover Preview -->
            <div v-if="newBlog.coverImageUrl || newBlog.coverVideoUrl" class="cover-preview col-span-2">
              <p class="sub-label">Cover Preview</p>
              <img v-if="newBlog.coverImageUrl" :src="newBlog.coverImageUrl" alt="New blog cover" class="cover-img" />
              <video v-if="newBlog.coverVideoUrl" :src="newBlog.coverVideoUrl" class="cover-img" controls />
            </div>

            <!-- Gallery Upload -->
            <div class="form-group col-span-2">
              <label class="form-label">
                Media Gallery
                <span v-if="newBlog.gallery.length" class="gallery-count">({{ newBlog.gallery.length }} items)</span>
              </label>
              <div class="gallery-upload-row">
                <input
                  ref="galleryFileInput"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  class="file-input"
                  @change="(e) => handleGalleryUpload(e, true)"
                />
                <label for="" class="upload-btn gallery-upload-btn" :class="{ uploading: galleryLoading }" @click="galleryFileInput?.click()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {{ galleryLoading ? `Uploading ${progress}%...` : 'Add Gallery Items' }}
                </label>
              </div>
            </div>

            <!-- Gallery Items -->
            <div v-if="newBlog.gallery.length" class="gallery-editor col-span-2">
              <div v-for="(item, index) in newBlog.gallery" :key="item.id" class="gallery-item">
                <div class="gallery-thumb">
                  <img v-if="item.type === 'image'" :src="item.url" :alt="item.caption || `Gallery item ${index + 1}`" />
                  <div v-else class="gallery-video-thumb">
                    <video :src="item.url" />
                    <span class="video-icon">▶</span>
                  </div>
                </div>
                <div class="gallery-controls">
                  <input
                    :value="item.caption"
                    @input="updateGalleryCaption(index, ($event.target as HTMLInputElement).value, true)"
                    class="form-input gallery-caption"
                    placeholder="Caption..."
                  />
                  <div class="gallery-actions">
                    <button @click="moveGalleryItem(index, 'up', true)" :disabled="index === 0" class="gallery-btn">↑</button>
                    <button @click="moveGalleryItem(index, 'down', true)" :disabled="index === newBlog.gallery.length - 1" class="gallery-btn">↓</button>
                    <button @click="removeGalleryItem(index, true)" class="gallery-btn delete">×</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Author</label>
              <input v-model="newBlog.authorName" class="form-input" />
            </div>
          </div>

          <div class="form-actions">
            <button @click="creating = false" class="cancel-btn">Cancel</button>
            <button @click="createBlog" class="save-btn" :disabled="saving">{{ saving ? 'Creating...' : 'Create Post' }}</button>
          </div>
        </div>

        <!-- Edit Existing Blog -->
        <div v-else-if="selectedBlog" class="editor-content">
          <div class="editor-header">
            <h3 class="editor-title">{{ selectedBlog.title }}</h3>
            <div class="header-actions">
              <button @click="togglePublished" class="pub-btn" :class="selectedBlog.isPublished ? 'pub-active' : 'pub-inactive'">
                {{ selectedBlog.isPublished ? 'Published' : 'Draft' }}
              </button>
              <button @click="editing = !editing" class="edit-btn">{{ editing ? 'Cancel' : 'Edit' }}</button>
              <button v-if="editing" @click="saveBlog" class="save-btn" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
              <button @click="deleteBlog" class="delete-btn">Delete</button>
            </div>
          </div>

          <div class="form-grid" :class="{ 'form-readonly': !editing }">
            <div class="form-group col-span-2">
              <label class="form-label">Title</label>
              <input v-model="selectedBlog.title" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Slug</label>
              <input v-model="selectedBlog.slug" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Excerpt</label>
              <textarea v-model="selectedBlog.excerpt" :readonly="!editing" class="form-input" rows="2"></textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Content</label>
              <textarea v-model="selectedBlog.content" :readonly="!editing" class="form-input content-area" rows="12"></textarea>
            </div>

            <!-- Cover Media -->
            <div class="form-group col-span-2">
              <label class="form-label">Cover Media</label>
              <div class="media-upload-row">
                <input v-model="selectedBlog.coverImageUrl" :readonly="!editing" class="form-input" placeholder="Image URL..." />
                <input v-model="selectedBlog.coverVideoUrl" :readonly="!editing" class="form-input" placeholder="Video URL..." />
                <input
                  :id="'edit-cover-upload'"
                  type="file"
                  accept="image/*,video/*"
                  class="file-input"
                  :disabled="!editing"
                  @change="(e) => handleCoverUpload(e, false)"
                />
                <label v-if="editing" :for="'edit-cover-upload'" class="upload-btn" :class="{ uploading: saving }">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {{ saving ? '...' : 'Up' }}
                </label>
              </div>
            </div>

            <!-- Cover Preview -->
            <div v-if="selectedBlog.coverImageUrl || selectedBlog.coverVideoUrl" class="cover-preview col-span-2">
              <p class="sub-label">Cover Preview</p>
              <img v-if="selectedBlog.coverImageUrl" :src="selectedBlog.coverImageUrl" :alt="selectedBlog.title" class="cover-img" />
              <video v-if="selectedBlog.coverVideoUrl" :src="selectedBlog.coverVideoUrl" class="cover-img" controls />
            </div>

            <!-- Gallery Management -->
            <div class="form-group col-span-2">
              <label class="form-label">
                Media Gallery
                <span v-if="selectedBlog.gallery?.length" class="gallery-count">({{ selectedBlog.gallery.length }} items)</span>
              </label>
              <div v-if="editing" class="gallery-upload-row">
                <input
                  ref="galleryFileInput"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  class="file-input"
                  @change="(e) => handleGalleryUpload(e, false)"
                />
                <label class="upload-btn gallery-upload-btn" :class="{ uploading: galleryLoading }" @click="galleryFileInput?.click()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {{ galleryLoading ? `Uploading ${progress}%...` : 'Add Gallery Items' }}
                </label>
              </div>
            </div>

            <!-- Gallery Items -->
            <div v-if="selectedBlog.gallery?.length" class="gallery-editor col-span-2">
              <div v-for="(item, index) in selectedBlog.gallery" :key="item.id" class="gallery-item">
                <div class="gallery-thumb">
                  <img v-if="item.type === 'image'" :src="item.url" :alt="item.caption || `Gallery item ${index + 1}`" />
                  <div v-else class="gallery-video-thumb">
                    <video :src="item.url" />
                    <span class="video-icon">▶</span>
                  </div>
                </div>
                <div class="gallery-controls">
                  <input
                    :value="item.caption"
                    @input="updateGalleryCaption(index, ($event.target as HTMLInputElement).value, false)"
                    :readonly="!editing"
                    class="form-input gallery-caption"
                    placeholder="Caption..."
                  />
                  <div v-if="editing" class="gallery-actions">
                    <button @click="moveGalleryItem(index, 'up', false)" :disabled="index === 0" class="gallery-btn">↑</button>
                    <button @click="moveGalleryItem(index, 'down', false)" :disabled="index === selectedBlog.gallery.length - 1" class="gallery-btn">↓</button>
                    <button @click="removeGalleryItem(index, false)" class="gallery-btn delete">×</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Author</label>
              <input v-model="selectedBlog.authorName" :readonly="!editing" class="form-input" />
            </div>
          </div>
        </div>

        <div v-else class="empty-editor">
          <p>Select a blog post or create a new one</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alert { padding: 0.75rem 1rem; font-size: 0.8rem; margin-bottom: 1rem; border: 1px solid; }
.alert-success { background: rgba(76,175,80,0.1); border-color: rgba(76,175,80,0.3); color: #4caf50; }
.alert-error { background: rgba(224,123,90,0.1); border-color: rgba(224,123,90,0.3); color: #e07b5a; }

.manager-grid { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; min-height: 500px; }

.blog-list { background: rgba(10,46,74,0.3); border: 1px solid rgba(201,168,76,0.1); overflow: hidden; display: flex; flex-direction: column; }
.list-header { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid rgba(201,168,76,0.1); }
.list-title { font-family: 'Montserrat', sans-serif; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); }
.new-btn { background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.3); color: #c9a84c; font-family: 'Montserrat', sans-serif; font-size: 0.6rem; font-weight: 600; padding: 0.25rem 0.75rem; cursor: pointer; }
.blogs-scroll { overflow-y: auto; max-height: 600px; }

.blog-item { display: flex; gap: 0.75rem; padding: 0.75rem 1rem; background: none; border: none; border-bottom: 1px solid rgba(201,168,76,0.05); color: rgba(248,245,239,0.7); cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; }
.blog-item:hover { background: rgba(201,168,76,0.05); }
.blog-selected { background: rgba(201,168,76,0.1); border-left: 2px solid #c9a84c; }
.blog-thumb { width: 48px; height: 36px; overflow: hidden; flex-shrink: 0; border: 1px solid rgba(201,168,76,0.15); position: relative; }
.blog-thumb img, .blog-thumb video { width: 100%; height: 100%; object-fit: cover; }
.video-thumb { background: #000; }
.video-badge { position: absolute; bottom: 2px; left: 2px; font-size: 0.45rem; background: rgba(201,168,76,0.8); color: #071a2b; padding: 1px 3px; font-weight: 700; letter-spacing: 0.1em; }
.blog-title-text { font-size: 0.75rem; font-weight: 500; line-height: 1.3; }
.blog-date { font-size: 0.55rem; color: rgba(248,245,239,0.35); margin-top: 0.25rem; }
.blog-status { font-size: 0.5rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.125rem 0.375rem; display: inline-block; margin-top: 0.25rem; }
.gallery-badge { font-size: 0.5rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.125rem 0.375rem; display: inline-block; margin-top: 0.25rem; margin-left: 0.25rem; background: rgba(13,110,122,0.2); color: #0d6e7a; }
.status-published { background: rgba(76,175,80,0.15); color: #4caf50; }
.status-draft { background: rgba(201,168,76,0.15); color: #c9a84c; }

.blog-editor { background: rgba(10,46,74,0.3); border: 1px solid rgba(201,168,76,0.1); padding: 1.5rem; }
.empty-editor { display: flex; align-items: center; justify-content: center; min-height: 400px; color: rgba(248,245,239,0.35); }

.editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
.editor-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 300; color: #f8f5ef; }
.header-actions { display: flex; gap: 0.5rem; }
.pub-btn, .edit-btn, .save-btn, .delete-btn, .cancel-btn { padding: 0.375rem 0.75rem; font-family: 'Montserrat', sans-serif; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border: 1px solid; transition: all 0.2s; }
.pub-active { background: rgba(76,175,80,0.15); border-color: rgba(76,175,80,0.3); color: #4caf50; }
.pub-inactive { background: rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.3); color: #c9a84c; }
.edit-btn { background: rgba(10,46,74,0.5); border-color: rgba(201,168,76,0.2); color: rgba(248,245,239,0.7); }
.save-btn { background: #c9a84c; border-color: #c9a84c; color: #071a2b; }
.save-btn:disabled { opacity: 0.5; }
.cancel-btn { background: none; border-color: rgba(248,245,239,0.2); color: rgba(248,245,239,0.5); }
.delete-btn { background: none; border-color: rgba(224,123,90,0.3); color: rgba(224,123,90,0.7); }
.delete-btn:hover { background: rgba(224,123,90,0.1); color: #e07b5a; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.form-readonly .form-input { opacity: 0.7; cursor: default; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.col-span-2 { grid-column: span 2; }
.form-label { font-family: 'Montserrat', sans-serif; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); }
.form-input { background: rgba(7,26,43,0.6); border: 1px solid rgba(201,168,76,0.2); color: #f8f5ef; padding: 0.625rem 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.8rem; outline: none; transition: border-color 0.3s; -webkit-appearance: none; resize: vertical; }
.form-input:focus { border-color: #c9a84c; }
.content-area { min-height: 200px; }

.form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

.sub-label { font-family: 'Montserrat', sans-serif; font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.4); margin-bottom: 0.5rem; }
.cover-preview { margin-top: 1rem; }
.cover-img { max-width: 100%; max-height: 200px; object-fit: cover; border: 1px solid rgba(201,168,76,0.15); }

.loading-state { padding: 2rem; text-align: center; color: rgba(248,245,239,0.4); }

/* Media Upload Row */
.media-upload-row {
  display: flex;
  gap: 0.4rem;
  align-items: stretch;
  flex-wrap: wrap;
}

.media-upload-row .form-input {
  flex: 1;
  min-width: 150px;
}

.file-input {
  display: none;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0 0.625rem;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.2);
  color: #c9a84c;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  min-width: 40px;
}

.upload-btn:hover {
  background: rgba(201, 168, 76, 0.2);
  border-color: #c9a84c;
}

.upload-btn.uploading {
  opacity: 0.5;
  cursor: not-allowed;
}

.gallery-upload-btn {
  min-width: 140px;
  padding: 0.5rem 0.75rem;
}

.gallery-count {
  font-weight: 400;
  color: rgba(248,245,239,0.35);
  margin-left: 0.25rem;
}

/* Gallery Editor */
.gallery-editor {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.gallery-item {
  background: rgba(7,26,43,0.5);
  border: 1px solid rgba(201,168,76,0.1);
  overflow: hidden;
}

.gallery-thumb {
  width: 100%;
  height: 100px;
  overflow: hidden;
  background: rgba(0,0,0,0.2);
}

.gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-video-thumb {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.gallery-video-thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.7;
}

.gallery-video-thumb .video-icon {
  position: absolute;
  color: rgba(255,255,255,0.9);
  font-size: 1.25rem;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.gallery-controls {
  padding: 0.5rem;
}

.gallery-caption {
  font-size: 0.7rem;
  padding: 0.375rem 0.5rem;
  margin-bottom: 0.375rem;
}

.gallery-actions {
  display: flex;
  gap: 0.25rem;
}

.gallery-btn {
  flex: 1;
  padding: 0.25rem;
  background: rgba(201,168,76,0.1);
  border: 1px solid rgba(201,168,76,0.2);
  color: #c9a84c;
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.2s;
}

.gallery-btn:hover:not(:disabled) {
  background: rgba(201,168,76,0.2);
}

.gallery-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.gallery-btn.delete {
  background: rgba(224,123,90,0.1);
  border-color: rgba(224,123,90,0.2);
  color: #e07b5a;
}

.gallery-btn.delete:hover {
  background: rgba(224,123,90,0.2);
}

@media (max-width: 768px) {
  .manager-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
  .media-upload-row { flex-wrap: wrap; }
  .upload-btn { width: auto; padding: 0.5rem; }
  .gallery-editor { grid-template-columns: repeat(2, 1fr); }
}
</style>
