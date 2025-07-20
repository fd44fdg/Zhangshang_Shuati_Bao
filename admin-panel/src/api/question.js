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

// --------------- 批量操作 ---------------

/**
 * 批量创建题目
 * @param {object} data 包含题目数组的数据
 */
export function createBatchQuestions(data) {
  return request({
    url: '/questions/batch',
    method: 'post',
    data
  })
}

/**
 * 批量删除题目
 * @param {array} ids 题目ID数组
 */
export function deleteBatchQuestions(ids) {
  return request({
    url: '/questions/batch',
    method: 'delete',
    data: { ids }
  })
}

/**
 * 批量更新题目状态
 * @param {array} ids 题目ID数组
 * @param {number} status 状态值
 */
export function updateBatchQuestionStatus(ids, status) {
  return request({
    url: '/questions/batch/status',
    method: 'put',
    data: { ids, status }
  })
}

// --------------- 模板管理 ---------------

/**
 * 获取题目模板列表
 * @param {object} params 查询参数
 */
export function fetchQuestionTemplates(params) {
  return request({
    url: '/questions/templates',
    method: 'get',
    params
  })
}

/**
 * 获取单个题目模板
 * @param {number} id 模板ID
 */
export function fetchQuestionTemplate(id) {
  return request({
    url: `/questions/templates/${id}`,
    method: 'get'
  })
}

/**
 * 创建题目模板
 * @param {object} data 模板数据
 */
export function createQuestionTemplate(data) {
  return request({
    url: '/questions/templates',
    method: 'post',
    data
  })
}

/**
 * 更新题目模板
 * @param {number} id 模板ID
 * @param {object} data 模板数据
 */
export function updateQuestionTemplate(id, data) {
  return request({
    url: `/questions/templates/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除题目模板
 * @param {number} id 模板ID
 */
export function deleteQuestionTemplate(id) {
  return request({
    url: `/questions/templates/${id}`,
    method: 'delete'
  })
}

/**
 * 从模板创建题目
 * @param {number} templateId 模板ID
 * @param {object} customData 自定义数据
 */
export function createFromTemplate(templateId, customData) {
  return request({
    url: `/questions/from-template/${templateId}`,
    method: 'post',
    data: customData
  })
}

// --------------- 文件操作 ---------------

/**
 * 上传文件
 * @param {FormData} formData 文件数据
 */
export function uploadFile(formData) {
  return request({
    url: '/questions/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * Excel批量导入题目
 * @param {FormData} formData Excel文件数据
 */
export function importQuestionsFromExcel(formData) {
  return request({
    url: '/questions/import/excel',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 导出题目为Excel
 * @param {object} params 导出参数
 */
export function exportQuestionsToExcel(params) {
  return request({
    url: '/questions/export/excel',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

/**
 * 下载Excel导入模板
 */
export function downloadImportTemplate() {
  return request({
    url: '/questions/import/template',
    method: 'get',
    responseType: 'blob'
  })
}

// --------------- 统计分析 ---------------

/**
 * 获取题目统计信息
 * @param {object} params 查询参数
 */
export function fetchQuestionStats(params) {
  return request({
    url: '/questions/stats',
    method: 'get',
    params
  })
}

/**
 * 获取题目难度分布
 */
export function fetchQuestionDifficultyDistribution() {
  return request({
    url: '/questions/stats/difficulty',
    method: 'get'
  })
}

/**
 * 获取题目类型分布
 */
export function fetchQuestionTypeDistribution() {
  return request({
    url: '/questions/stats/type',
    method: 'get'
  })
}

/**
 * 获取题目分类分布
 */
export function fetchQuestionCategoryDistribution() {
  return request({
    url: '/questions/stats/category',
    method: 'get'
  })
}

// --------------- 搜索和筛选 ---------------

/**
 * 搜索题目
 * @param {object} params 搜索参数
 */
export function searchQuestions(params) {
  return request({
    url: '/questions/search',
    method: 'get',
    params
  })
}

/**
 * 获取题目标签列表
 */
export function fetchQuestionTags() {
  return request({
    url: '/questions/tags',
    method: 'get'
  })
}

/**
 * 获取知识点列表
 */
export function fetchKnowledgePoints() {
  return request({
    url: '/questions/knowledge-points',
    method: 'get'
  })
}

// --------------- 题目验证 ---------------

/**
 * 验证题目数据
 * @param {object} data 题目数据
 */
export function validateQuestion(data) {
  return request({
    url: '/questions/validate',
    method: 'post',
    data
  })
}

/**
 * 检查题目重复
 * @param {object} params 检查参数
 */
export function checkQuestionDuplicate(params) {
  return request({
    url: '/questions/check-duplicate',
    method: 'get',
    params
  })
}