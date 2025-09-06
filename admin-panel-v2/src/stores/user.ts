import { defineStore } from 'pinia'
import { api } from '../utils/api'

export interface UserProfile {
  id: number
  username: string
  nickname?: string
  avatar?: string
  roles: string[]
}

interface State {
  profile: UserProfile | null
  loading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): State => ({
    profile: null,
    loading: false
  }),
  getters: {
    isLogged: (s) => !!s.profile,
    roles: (s) => s.profile?.roles || [],
    nickname: (s) => s.profile?.nickname || s.profile?.username || '未登录',
    avatar: (s) => s.profile?.avatar || '/default-avatar.svg'
  },
  actions: {
    async login(username: string, password: string) {
      this.loading = true
      try {
        await api.post('/auth/login-v2', { username, password })
        await this.fetchProfile()
      } finally {
        this.loading = false
      }
    },
    async fetchProfile(force = false) {
      if (this.profile && !force) return this.profile
      try {
        const res = await api.get('/auth/me')
        // 兼容两种格式：{ success:true, data:{...} } 或 直接 { id, username }
        const body = res.data
        let data: any = null
        if (body && typeof body === 'object') {
          if ('success' in body && body.success && body.data) data = body.data
          else if ('id' in body && 'username' in body) data = body
        }
        if (data) {
          this.profile = {
            id: data.id,
            username: data.username,
            nickname: data.nickname,
            avatar: data.avatar,
            roles: data.roles || []
          }
        } else {
          this.profile = null
        }
        return this.profile
      } catch (e: any) {
        this.profile = null
        throw e
      }
    },
    hasRole(role: string) {
      return this.roles.includes(role)
    },
    async logout() {
      await api.post('/auth/logout-v2').catch(() => {})
      this.profile = null
    },
    updateProfileLocal(partial: Partial<UserProfile>) {
      if (!this.profile) return
      this.profile = { ...this.profile, ...partial }
    }
  }
})
