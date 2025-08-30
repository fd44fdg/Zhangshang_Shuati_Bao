/**
 * Linus式统一API客户端
 * 消除三个前端项目的API重复代码
 * "好品味" - 一个地方定义，到处使用
 */

import axios from 'axios'

// 创建axios实例
const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 自动添加token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  response => {
    // 如果后端返回success: false，当作错误处理
    if (response.data.success === false) {
      return Promise.reject(new Error(response.data.message || '请求失败'))
    }
    return response.data
  },
  error => {
    // 处理401未授权
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }
    
    // 处理403禁止访问
    if (error.response?.status === 403) {
      return Promise.reject(new Error('没有权限访问此资源'))
    }
    
    // 处理404
    if (error.response?.status === 404) {
      return Promise.reject(new Error('请求的资源不存在'))
    }
    
    // 处理500
    if (error.response?.status === 500) {
      return Promise.reject(new Error('服务器内部错误'))
    }
    
    // 网络错误
    if (error.message === 'Network Error') {
      return Promise.reject(new Error('网络连接失败，请检查网络'))
    }
    
    // 超时错误
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请重试'))
    }
    
    // 其他错误
    const message = error.response?.data?.message || error.message || '未知错误'
    return Promise.reject(new Error(message))
  }
)

/**
 * Linus式CRUD API工厂
 * 消除重复的API调用代码
 */
class APIFactory {
  constructor(resource) {
    this.resource = resource
  }

  // 通用查询方法
  list(params = {}) {
    return apiClient.get(`/${this.resource}`, { params })
  }

  // 根据ID获取
  getById(id) {
    return apiClient.get(`/${this.resource}/${id}`)
  }

  // 创建
  create(data) {
    return apiClient.post(`/${this.resource}`, data)
  }

  // 更新
  update(id, data) {
    return apiClient.put(`/${this.resource}/${id}`, data)
  }

  // 删除
  delete(id) {
    return apiClient.delete(`/${this.resource}/${id}`)
  }
}

/**
 * 创建API实例的工厂函数
 */
function createAPI(resource) {
  return new APIFactory(resource)
}

// 预定义的API实例
export const articlesAPI = createAPI('articles')
export const categoriesAPI = createAPI('article_categories')
export const questionsAPI = createAPI('questions')
export const examsAPI = createAPI('exams')
export const usersAPI = createAPI('users')

// 认证相关API
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  profile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data)
}

// 统计相关API
export const statsAPI = {
  dashboard: () => apiClient.get('/stats/dashboard'),
  userStats: () => apiClient.get('/stats/user')
}

// 搜索相关API
export const searchAPI = {
  articles: (query) => apiClient.get('/search/articles', { params: { q: query } }),
  questions: (query) => apiClient.get('/search/questions', { params: { q: query } })
}

// 导出默认的apiClient，用于自定义请求
export default apiClient