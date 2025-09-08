<template>
  <view class="kp-detail-container">
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else-if="error" class="error">{{ error }}</view>
    <view v-else-if="!point" class="empty">未找到该知识点</view>
    <view v-else class="content-card">
      <view class="header">
        <text class="title">{{ point.title }}</text>
        <view class="meta">
          <text class="meta-item">分类：{{ point.category || '未分类' }}</text>
          <text class="meta-item">难度：{{ difficultyText(point.difficulty) }}</text>
          <text v-if="point.questionCount" class="meta-item">题目：{{ point.questionCount }}</text>
        </view>
      </view>
      <view class="body">
        <text class="desc" v-if="point.description">{{ point.description }}</text>
        <view v-else class="placeholder">暂无描述</view>
      </view>
      <view class="actions">
        <button size="mini" type="primary" @click="goPractice">针对该知识点练习</button>
        <button size="mini" @click="goBack">返回</button>
      </view>
    </view>
  </view>
</template>

<script>
import { getKnowledgePointDetail } from '@/api/knowledge'
export default {
  data() {
    return { id: null, point: null, loading: true, error: '' }
  },
  onLoad(query) {
    if (query && query.id) {
      this.id = query.id
      this.fetchDetail()
    } else {
      this.error = '缺少ID参数'
      this.loading = false
    }
  },
  methods: {
    async fetchDetail() {
      this.loading = true
      this.error = ''
      try {
        const res = await getKnowledgePointDetail(this.id)
        if (res.success) {
          this.point = res.data
          uni.setNavigationBarTitle({ title: this.point.title || '知识点详情' })
        } else {
          this.error = '加载失败'
        }
      } catch (e) {
        this.error = e.message || '请求失败'
      } finally {
        this.loading = false
      }
    },
    difficultyText(d) {
      const map = {1:'入门',2:'初级',3:'中级',4:'高级',5:'专家'}
      return map[d] || d
    },
    goPractice() {
      if (!this.point) return
      // 跳转到练习页（按知识点标题作为分类/标签参数）
      uni.navigateTo({ url: `/pages/practice/practice?knowledge=${encodeURIComponent(this.point.title)}` })
    },
    goBack() { uni.navigateBack() }
  }
}
</script>

<style scoped>
.kp-detail-container { padding:32rpx; background: var(--bg-color,#f5f5f5); min-height:100vh; }
.loading, .error, .empty { text-align:center; padding:120rpx 0; color:#666; }
.content-card { background:#fff; border-radius:24rpx; padding:40rpx 36rpx 32rpx; box-shadow:0 4rpx 16rpx rgba(0,0,0,0.06); }
.header { margin-bottom:32rpx; }
.title { font-size:40rpx; font-weight:600; color:#222; display:block; margin-bottom:12rpx; }
.meta { display:flex; flex-wrap:wrap; margin:-4rpx; }
.meta-item { font-size:22rpx; color:#888; margin:4rpx 16rpx 4rpx 0; }
.body { margin-bottom:40rpx; }
.desc { font-size:28rpx; line-height:1.6; color:#333; white-space:pre-wrap; }
.placeholder { font-size:26rpx; color:#aaa; }
.actions { display:flex; gap:20rpx; }
</style>
