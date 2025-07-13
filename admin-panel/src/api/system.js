import request from '@/utils/request'

/**
 * 获取系统设置
 */
export function fetchSettings() {
  return request({
    url: '/system/settings',
    method: 'get'
  })
}

/**
 * 更新系统设置
 * @param {object} data 设置数据
 */
export function updateSettings(data) {
  return request({
    url: '/system/settings',
    method: 'post',
    data
  })
} 