import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { useUserStore } from '../stores/user'

// 扩展请求配置类型
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// 后端实际路由前缀为 /api/v1
const baseURL = (import.meta as any).env?.VITE_API_BASE || '/api/v1'

export const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true
})

// Dev Mock 仅在显式设置 VITE_DEV_AUTO_MOCK=1 时启用；生产永远不会触发
if (import.meta.env.DEV && (import.meta as any).env?.VITE_DEV_AUTO_MOCK === '1') {
  const enableMockLayer = () => {
    if ((api as any)._mockEnabled) return
    console.warn('[api] (dev mock) enabled')
    ;(api as any)._mockEnabled = true
    api.interceptors.request.use((cfg: any) => {
      (cfg as any)._mock = true
      const url = cfg.url || ''
      if (url.startsWith('/auth/login-v2') || url.startsWith('/auth/me') || url.startsWith('/auth/logout-v2')) {
        const mockErr: any = new Error('mock:short-circuit')
        mockErr.config = cfg
        mockErr.__mockShort = true
        return Promise.reject(mockErr)
      }
      return cfg
    })
    api.interceptors.response.use(r => r, err => {
      if (!(err.config as any)?._mock) return Promise.reject(err)
      const url = err.config?.url || ''
      if (url.startsWith('/auth/login-v2')) {
        return Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: err.config })
      }
      if (url.startsWith('/auth/me')) {
        return Promise.resolve({ data: { success: true, data: { id: 0, username: 'dev-admin', roles: ['admin'] } }, status: 200, statusText: 'OK', headers: {}, config: err.config })
      }
      if (url.startsWith('/auth/logout-v2')) {
        return Promise.resolve({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config: err.config })
      }
      return Promise.reject(err)
    })
  }
  enableMockLayer()
}

// 请求队列管理
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: any) => void
  reject: (error: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

api.interceptors.response.use(
  (res: AxiosResponse) => {
    // 不再剥离 success/data，保持后端结构，避免上层判断失效
    return res
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig
    const status = error.response?.status

    // 401 错误且不是刷新请求且未尝试刷新过
    if (status === 401 && 
        originalRequest &&
        !originalRequest._retry && 
        originalRequest.url !== '/auth/refresh') {
      
      if (isRefreshing) {
        // 如果正在刷新，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => {
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // 尝试刷新 token
        await api.post('/auth/refresh')
        processQueue(null)
        isRefreshing = false
        
        // 重新执行原请求
        return api(originalRequest)
      } catch (refreshError) {
        // 刷新失败，清除用户状态
        processQueue(refreshError, null)
        isRefreshing = false
        
        const store = useUserStore()
        store.logout()
        
        // 导航到登录页
        if (location.pathname !== '/login') {
          const redirect = encodeURIComponent(location.pathname + location.search)
          window.location.href = `/login?redirect=${redirect}`
        }
        return Promise.reject(refreshError)
      }
    }

    const msg = (error.response?.data as any)?.message || error.message || '请求失败'
    return Promise.reject(new Error(msg))
  }
)
