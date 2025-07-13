import request from '@/utils/request'

/**
 * 获取用户列表
 * @param {object} params 查询参数，如 page, limit, keyword 等
 */
export function fetchUsers(params) {
  return request({
    url: '/users', // 完整路径是 /api/v1/admin/users
    method: 'get',
    params
  })
}

/**
 * 创建新用户
 * @param {object} data 用户数据
 */
export function createUser(data) {
  return request({
    url: '/users',
    method: 'post',
    data
  })
}

/**
 * 获取单个用户详情
 * @param {number} id 用户ID
 */
export function fetchUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'get'
  })
}

/**
 * 更新用户信息
 * @param {number} id 用户ID
 * @param {object} data 用户数据
 */
export function updateUser(id, data) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除用户
 * @param {number} id 用户ID
 */
export function deleteUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  })
}

/**
 * 获取单个用户的统计信息
 * @param {number} id 用户ID
 */
export function fetchUserStats(id) {
  return request({
    url: `/users/${id}/stats`,
    method: 'get'
  })
} 