
import request from '@/utils/request';

/**
 * 获取当前用户信息
 */
export function getUser() {
  return request.get('/me');
}

/**
 * 获取当前用户的错题列表 (分页)
 * @param {Object} params e.g., { page, limit }
 */
export function getMyWrongQuestions(params) {
  return request.get('/me/wrong-questions', { params });
}

/**
 * 获取当前用户的收藏列表 (分页)
 * @param {Object} params e.g., { page, limit }
 */
export function getMyFavorites(params) {
  return request.get('/me/favorites', { params });
}

/**
 * 获取用户统计数据
 */
export function getUserStats() {
  return request.get('/stats/summary');
}
