<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAdminAuth, type FirebaseUser } from '@/composables/useAdminAuth'

const { isOwner, isAdmin, user, getAllUsers, updateUserRole, grantAdminAccess } = useAdminAuth()

const OWNER_EMAIL = 'johnfritzizar35@gmail.com'

const users = ref<FirebaseUser[]>([])
const loading = ref(true)
const grantEmail = ref('')
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const searchQuery = ref('')

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(u =>
    u.email.toLowerCase().includes(q) ||
    u.displayName?.toLowerCase().includes(q)
  )
})

const stats = computed(() => ({
  total: users.value.length,
  admins: users.value.filter(u => u.role === 'admin' || u.role === 'owner').length,
  regularUsers: users.value.filter(u => u.role === 'user').length,
}))

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}

async function loadUsers() {
  loading.value = true
  users.value = await getAllUsers()
  loading.value = false
}

async function grantAccess() {
  if (!grantEmail.value.trim()) return
  const email = grantEmail.value.trim().toLowerCase()

  const existingUser = users.value.find(u => u.email === email)

  if (existingUser) {
    const success = await updateUserRole(existingUser.uid, 'admin')
    if (success) {
      existingUser.role = 'admin'
      showMessage(`Admin access granted to ${email}`, 'success')
    } else {
      showMessage('Failed to grant access', 'error')
    }
  } else {
    const success = await grantAdminAccess(email)
    if (success) {
      showMessage(`Pending grant created for ${email}. They will get admin access when they sign up.`, 'success')
    } else {
      showMessage('Failed to create pending grant', 'error')
    }
  }

  grantEmail.value = ''
  await loadUsers()
}

async function revokeAccess(u: FirebaseUser) {
  if (u.email === OWNER_EMAIL) {
    showMessage('Cannot revoke owner access', 'error')
    return
  }

  const success = await updateUserRole(u.uid, 'user')
  if (success) {
    u.role = 'user'
    showMessage(`Admin access revoked for ${u.email}`, 'success')
    await loadUsers()
  } else {
    showMessage('Failed to revoke access', 'error')
  }
}

async function promoteAccess(u: FirebaseUser) {
  const success = await updateUserRole(u.uid, 'admin')
  if (success) {
    u.role = 'admin'
    showMessage(`Admin access granted to ${u.email}`, 'success')
    await loadUsers()
  } else {
    showMessage('Failed to grant access', 'error')
  }
}

function formatDate(timestamp: any): string {
  if (!timestamp) return 'Unknown'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(loadUsers)
</script>

<template>
  <div class="users-page">
    <div v-if="!isOwner" class="access-denied">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(224,123,90,0.5)" stroke-width="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <h2 class="denied-title">Access Restricted</h2>
      <p class="denied-text">Only the site owner can manage user access.</p>
    </div>

    <template v-else>
      <div v-if="message" class="alert" :class="`alert-${messageType}`">{{ message }}</div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#c9a84c">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ stats.total }}</p>
            <p class="stat-label">Total Users</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-gold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#c9a84c">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
            </svg>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ stats.admins }}</p>
            <p class="stat-label">Admins</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(248,245,239,0.5)">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ stats.regularUsers }}</p>
            <p class="stat-label">Regular Users</p>
          </div>
        </div>
      </div>

      <!-- Grant Access -->
      <div class="settings-card">
        <h3 class="card-title">Grant Admin Access</h3>
        <p class="card-desc">Enter an email address to grant admin access. If the user has already signed in, they will be promoted immediately. Otherwise, a pending grant will be applied when they register.</p>

        <div class="grant-row">
          <input
            v-model="grantEmail"
            class="form-input"
            type="email"
            placeholder="user@example.com"
            @keyup.enter="grantAccess"
          />
          <button @click="grantAccess" class="grant-btn">Grant Access</button>
        </div>
      </div>

      <!-- User List -->
      <div class="settings-card">
        <div class="card-header-row">
          <div>
            <h3 class="card-title">Registered Users</h3>
            <p class="card-desc">Manage admin access for registered users.</p>
          </div>
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search users..."
              class="search-input"
            />
          </div>
        </div>

        <div v-if="loading" class="loading-state">Loading users...</div>

        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          {{ searchQuery ? 'No users match your search.' : 'No registered users found. Users will appear here after they sign in.' }}
        </div>

        <div v-else class="users-list">
          <div
            v-for="u in filteredUsers"
            :key="u.uid"
            class="user-row"
            :class="{ 'user-owner': u.email === OWNER_EMAIL }"
          >
            <div class="user-row-avatar" :class="{ 'owner-avatar': u.email === OWNER_EMAIL }">
              {{ u.email?.charAt(0).toUpperCase() || '?' }}
            </div>
            <div class="user-row-info">
              <p class="user-row-email">{{ u.email }}</p>
              <p class="user-row-name">{{ u.displayName || 'No name set' }}</p>
              <p class="user-row-date">Joined {{ formatDate(u.createdAt) }}</p>
            </div>
            <div class="user-row-role">
              <span class="role-badge" :class="`role-${u.role}`">
                {{ u.email === OWNER_EMAIL ? 'Owner' : u.role }}
              </span>
            </div>
            <div class="user-row-actions">
              <button
                v-if="u.email !== OWNER_EMAIL && u.role !== 'admin' && u.role !== 'owner'"
                @click="promoteAccess(u)"
                class="action-btn promote-btn"
              >
                Make Admin
              </button>
              <button
                v-if="u.email !== OWNER_EMAIL && (u.role === 'admin')"
                @click="revokeAccess(u)"
                class="action-btn revoke-btn"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.access-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
  text-align: center;
}

.denied-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 300;
  color: #e07b5a;
}

.denied-text {
  font-size: 0.85rem;
  color: rgba(248, 245, 239, 0.5);
}

.alert { padding: 0.75rem 1rem; font-size: 0.8rem; margin-bottom: 1rem; border: 1px solid; }
.alert-success { background: rgba(76,175,80,0.1); border-color: rgba(76,175,80,0.3); color: #4caf50; }
.alert-error { background: rgba(224,123,90,0.1); border-color: rgba(224,123,90,0.3); color: #e07b5a; }

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(10, 46, 74, 0.4);
  border: 1px solid rgba(201, 168, 76, 0.12);
}

.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.2);
  flex-shrink: 0;
}

.stat-icon-gold {
  background: rgba(201, 168, 76, 0.15);
}

.stat-value {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 300;
  color: #c9a84c;
}

.stat-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.55rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.5);
}

.settings-card { background: rgba(10,46,74,0.3); border: 1px solid rgba(201,168,76,0.1); padding: 1.5rem; margin-bottom: 1.5rem; }

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.card-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 300; color: #f8f5ef; margin-bottom: 0.25rem; }
.card-desc { font-size: 0.8rem; color: rgba(248,245,239,0.5); margin-bottom: 1.5rem; line-height: 1.6; }

.card-header-row .card-desc {
  margin-bottom: 0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(7, 26, 43, 0.6);
  border: 1px solid rgba(201, 168, 76, 0.2);
  padding: 0.5rem 0.75rem;
  color: rgba(248, 245, 239, 0.5);
}

.search-input {
  background: transparent;
  border: none;
  color: #f8f5ef;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  outline: none;
  width: 180px;
}

.search-input::placeholder {
  color: rgba(248, 245, 239, 0.35);
}

.grant-row { display: flex; gap: 0.75rem; }
.form-input { flex: 1; background: rgba(7,26,43,0.6); border: 1px solid rgba(201,168,76,0.2); color: #f8f5ef; padding: 0.625rem 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.8rem; outline: none; transition: border-color 0.3s; -webkit-appearance: none; }
.form-input:focus { border-color: #c9a84c; }

.grant-btn { padding: 0.625rem 1.5rem; background: #c9a84c; border: 1px solid #c9a84c; color: #071a2b; font-family: 'Montserrat', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.grant-btn:hover { background: #e8c05a; }

.loading-state { padding: 2rem; text-align: center; color: rgba(248,245,239,0.4); }
.empty-state { padding: 2rem; text-align: center; color: rgba(248,245,239,0.4); font-size: 0.85rem; border: 1px dashed rgba(201,168,76,0.15); }

.users-list { display: flex; flex-direction: column; gap: 0.5rem; }

.user-row { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(7,26,43,0.4); border: 1px solid rgba(201,168,76,0.08); transition: border-color 0.2s; }
.user-row:hover { border-color: rgba(201,168,76,0.2); }
.user-owner { border-color: rgba(201,168,76,0.3); background: rgba(201,168,76,0.05); }

.user-row-avatar { width: 40px; height: 40px; background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.2); display: flex; align-items: center; justify-content: center; font-family: 'Montserrat', sans-serif; font-size: 0.9rem; font-weight: 600; color: #c9a84c; flex-shrink: 0; }
.owner-avatar { background: rgba(201,168,76,0.3); border-color: #c9a84c; box-shadow: 0 0 8px rgba(201,168,76,0.2); }

.user-row-info { flex: 1; min-width: 0; }
.user-row-email { font-size: 0.8rem; color: rgba(248,245,239,0.85); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-row-name { font-size: 0.7rem; color: rgba(248,245,239,0.5); margin-top: 0.125rem; }
.user-row-date { font-size: 0.6rem; color: rgba(248,245,239,0.3); margin-top: 0.125rem; }

.user-row-role { flex-shrink: 0; }

.role-badge { font-family: 'Montserrat', sans-serif; font-size: 0.55rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.25rem 0.625rem; display: inline-block; }
.role-owner { background: rgba(201,168,76,0.25); color: #c9a84c; border: 1px solid rgba(201,168,76,0.4); }
.role-admin { background: rgba(76,175,80,0.15); color: #4caf50; border: 1px solid rgba(76,175,80,0.3); }
.role-user { background: rgba(248,245,239,0.05); color: rgba(248,245,239,0.4); border: 1px solid rgba(248,245,239,0.1); }

.user-row-actions { flex-shrink: 0; }

.action-btn { padding: 0.375rem 0.75rem; font-family: 'Montserrat', sans-serif; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border: 1px solid; transition: all 0.2s; }
.promote-btn { background: rgba(76,175,80,0.1); border-color: rgba(76,175,80,0.3); color: #4caf50; }
.promote-btn:hover { background: rgba(76,175,80,0.2); }
.revoke-btn { background: rgba(224,123,90,0.1); border-color: rgba(224,123,90,0.3); color: #e07b5a; }
.revoke-btn:hover { background: rgba(224,123,90,0.2); }

@media (max-width: 768px) {
  .grant-row { flex-direction: column; }
  .user-row { flex-wrap: wrap; }
  .user-row-actions { width: 100%; display: flex; gap: 0.5rem; margin-top: 0.5rem; }
  .action-btn { flex: 1; text-align: center; }
  .card-header-row { flex-direction: column; }
  .search-box { width: 100%; }
  .search-input { flex: 1; width: auto; }
}
</style>
