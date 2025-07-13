import request from '@/utils/request'

// ===== 知识点分类接口 =====

/**
 * 获取知识点分类列表
 * @param {object} params 查询参数
 */
export function fetchKnowledgeCategories(params) {
  return request({
    url: '/knowledge/categories',
    method: 'get',
    params
  })
}

/**
 * 创建知识点分类
 * @param {object} data 分类数据
 */
export function createKnowledgeCategory(data) {
  return request({
    url: '/knowledge/categories',
    method: 'post',
    data
  })
}

/**
 * 更新知识点分类
 * @param {number} id 分类ID
 * @param {object} data 分类数据
 */
export function updateKnowledgeCategory(id, data) {
  return request({
    url: `/knowledge/categories/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除知识点分类
 * @param {number} id 分类ID
 */
export function deleteKnowledgeCategory(id) {
  return request({
    url: `/knowledge/categories/${id}`,
    method: 'delete'
  })
}

// ===== 知识点接口 =====

/**
 * 获取知识点列表
 * @param {object} params 查询参数
 */
export function fetchKnowledgePoints(params) {
  return request({
    url: '/knowledge/points',
    method: 'get',
    params
  })
}

/**
 * 创建知识点
 * @param {object} data 知识点数据
 */
export function createKnowledgePoint(data) {
  return request({
    url: '/knowledge/points',
    method: 'post',
    data
  })
}

/**
 * 更新知识点
 * @param {number} id 知识点ID
 * @param {object} data 知识点数据
 */
export function updateKnowledgePoint(id, data) {
  return request({
    url: `/knowledge/points/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除知识点
 * @param {number} id 知识点ID
 */
export function deleteKnowledgePoint(id) {
  return request({
    url: `/knowledge/points/${id}`,
    method: 'delete'
  })
} 