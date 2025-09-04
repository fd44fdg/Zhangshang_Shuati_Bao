import request from '@/utils/request';

// 获取可见的轮播图列表
export function getVisibleBanners() {
  // 修正：调用request对象的get方法
  return request.get('/banners');
}