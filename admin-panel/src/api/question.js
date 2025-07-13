import request from '@/utils/request'

// --------------- 题目管理 ---------------

/**
 * 获取题目列表
 * @param {object} params 查询参数
 */
export function fetchQuestions(params) {
  return request({
    url: '/questions', // 对应后端 GET /api/v1/questions
    method: 'get',
    params
  })
}

/**
 * 获取单个题目详情
 * @param {number} id 题目ID
 */
export function fetchQuestion(id) {
  return request({
    url: `/questions/${id}`,
    method: 'get'
  })
}

/**
 * 创建新题目
 * @param {object} data 题目数据
 */
export function createQuestion(data) {
  return request({
    url: '/questions',
    method: 'post',
    data
  })
}

/**
 * 更新题目
 * @param {number} id 题目ID
 * @param {object} data 题目数据
 */
export function updateQuestion(id, data) {
  return request({
    url: `/questions/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除题目
 * @param {number} id 题目ID
 */
export function deleteQuestion(id) {
  return request({
    url: `/questions/${id}`,
    method: 'delete'
  })
}


// --------------- 题目分类管理 ---------------

/**
 * 获取题目分类列表
 * @param {object} params 查询参数
 */
export function fetchQuestionCategories(params) {
  return request({
    url: '/questions/categories',
    method: 'get',
    params
  })
}

/**
 * 创建题目分类
 * @param {object} data 分类数据
 */
export function createQuestionCategory(data) {
  return request({
    url: '/questions/categories',
    method: 'post',
    data
  })
}

/**
 * 更新题目分类
 * @param {number} id 分类ID
 * @param {object} data 分类数据
 */
export function updateQuestionCategory(id, data) {
  return request({
    url: `/questions/categories/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除题目分类
 * @param {number} id 分类ID
 */
export function deleteQuestionCategory(id) {
  return request({
    url: `/questions/categories/${id}`,
    method: 'delete'
  })
} 