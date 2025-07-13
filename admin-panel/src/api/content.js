import request from '@/utils/request'

// ===== 文章接口 =====

/**
 * 获取文章列表
 * @param {object} params 查询参数
 */
export function fetchArticles(params) {
  return request({
    url: '/content/articles',
    method: 'get',
    params
  })
}

/**
 * 获取单篇文章详情
 * @param {number} id 文章ID
 */
export function fetchArticle(id) {
  return request({
    url: `/content/articles/${id}`,
    method: 'get'
  })
}

/**
 * 创建文章
 * @param {object} data 文章数据
 */
export function createArticle(data) {
  return request({
    url: '/content/articles',
    method: 'post',
    data
  })
}

/**
 * 更新文章
 * @param {number} id 文章ID
 * @param {object} data 文章数据
 */
export function updateArticle(id, data) {
  return request({
    url: `/content/articles/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除文章
 * @param {number} id 文章ID
 */
export function deleteArticle(id) {
  return request({
    url: `/content/articles/${id}`,
    method: 'delete'
  })
}

// ===== 文章分类接口 =====

/**
 * 获取文章分类列表
 */
export function fetchArticleCategories() {
  return request({
    url: '/content/articles/categories',
    method: 'get'
  })
}

/**
 * 创建文章分类
 * @param {object} data 分类数据
 */
export function createArticleCategory(data) {
  return request({
    url: '/content/articles/categories',
    method: 'post',
    data
  })
}

/**
 * 更新文章分类
 * @param {number} id 分类ID
 * @param {object} data 分类数据
 */
export function updateArticleCategory(id, data) {
  return request({
    url: `/content/articles/categories/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除文章分类
 * @param {number} id 分类ID
 */
export function deleteArticleCategory(id) {
  return request({
    url: `/content/articles/categories/${id}`,
    method: 'delete'
  })
} 