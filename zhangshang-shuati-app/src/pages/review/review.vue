<template>
	<view class="review-container">
		<!-- 头部导航 -->
		<view class="review-header">
			<view class="back-button" @click="goBack">
				<text class="back-icon">←</text>
			</view>
			<text class="header-title">知识点复习</text>
		</view>

		<!-- 进度概览 -->
		<view class="progress-overview">
			<view class="overview-card">
				<view class="overview-item">
					<text class="overview-number">{{ totalStudied }}</text>
					<text class="overview-label">已学习</text>
				</view>
				<view class="overview-item">
					<text class="overview-number">{{ totalKnowledge }}</text>
					<text class="overview-label">总知识点</text>
				</view>
				<view class="overview-item">
					<text class="overview-number">{{ totalKnowledge > 0 ? Math.round(totalStudied / totalKnowledge * 100) : 0 }}%</text>
					<text class="overview-label">完成度</text>
				</view>
			</view>
		</view>

		<!-- 知识分类卡片 -->
		<view class="knowledge-categories">
			<view class="section-title">
				<ModernIcon type="practice" :size="24" :active="true" />
				<text class="title-text">选择复习领域</text>
			</view>
			
			<view class="categories-grid">
				<view 
					v-for="category in knowledgeCategories" 
					:key="category.id"
					class="category-card"
					:class="{ 'completed': category.progress >= 100 }"
					@click="enterCategory(category)"
				>
					<view class="card-header">
						<ModernIcon :type="category.icon" :size="32" :active="category.progress >= 100" />
						<view class="progress-badge">
							<text class="progress-text">{{ category.progress }}%</text>
						</view>
					</view>
					<view class="card-content">
						<text class="category-title">{{ category.title }}</text>
						<text class="category-desc">{{ category.description }}</text>
						<view class="knowledge-stats">
							<text class="stats-text">{{ category.completed }}/{{ category.total }} 知识点</text>
						</view>
					</view>
					<view class="card-footer">
						<view class="progress-bar">
							<view class="progress-fill" :style="{ width: category.progress + '%' }"></view>
						</view>
						<text class="status-text">{{ getStatusText(category.progress) }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 最近学习 -->
		<view class="recent-study">
			<view class="section-title">
				<ModernIcon type="favorite" :size="24" :active="true" />
				<text class="title-text">最近学习</text>
			</view>
			
			<view class="recent-list">
				<view 
					v-for="item in recentStudy" 
					:key="item.id"
					class="recent-item"
					@click="continueStudy(item)"
				>
					<view class="recent-icon">
						<ModernIcon :type="item.icon" :size="28" />
					</view>
					<view class="recent-content">
						<text class="recent-title">{{ item.title }}</text>
						<text class="recent-time">{{ item.lastStudy }}</text>
					</view>
					<view class="recent-progress">
						<text class="progress-num">{{ item.progress }}%</text>
						<view class="mini-progress">
							<view class="mini-fill" :style="{ width: item.progress + '%' }"></view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 快速复习 -->
		<view class="quick-review">
			<view class="section-title">
				<ModernIcon type="exam" :size="24" :active="true" />
				<text class="title-text">快速复习</text>
			</view>
			
			<view class="quick-actions">
				<view class="action-card" @click="startQuickReview('weak')">
					<view class="action-icon weak">
						<ModernIcon type="settings" :size="32" />
					</view>
					<text class="action-title">薄弱知识点</text>
					<text class="action-desc">针对掌握不牢的知识点</text>
				</view>
				
				<view class="action-card" @click="startQuickReview('random')">
					<view class="action-icon random">
						<ModernIcon type="search" :size="32" />
					</view>
					<text class="action-title">随机复习</text>
					<text class="action-desc">随机选择知识点复习</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import ModernIcon from '@/components/ModernIcon.vue';
import { getWrongQuestions, getPracticeQuestions } from '@/api/question.js';
import { mockKnowledgeCategories, mockRecentStudy, mockProgress } from '@/mock/reviewData.js';

export default {
	name: "Review",
	components: {
		ModernIcon
	},
	data() {
		return {
			totalStudied: 0,
			totalKnowledge: 0,
			knowledgeCategories: [],
			recentStudy: []
		}
	},
	onLoad() {
		// In a real app, you would fetch this data from an API.
		// Here, we load it from a local mock file.
		this.totalStudied = mockProgress.totalStudied;
		this.totalKnowledge = mockProgress.totalKnowledge;
		this.knowledgeCategories = mockKnowledgeCategories;
		this.recentStudy = mockRecentStudy;
	},
	methods: {
		goBack() {
			uni.switchTab({
				url: '/pages/home/home'
			})
		},
		
		getStatusText(progress) {
			if (progress >= 100) return '已完成'
			if (progress >= 70) return '进行中'
			if (progress >= 30) return '入门中'
			return '未开始'
		},
		
		enterCategory(category) {
			console.log('进入分类:', category.title)
			uni.navigateTo({
				url: `/pages/knowledge/detail?categoryId=${category.id}&title=${encodeURIComponent(category.title)}`
			})
		},
		
		continueStudy(item) {
			console.log('继续学习:', item.title)
			uni.navigateTo({
				url: `/pages/knowledge/detail?itemId=${item.id}&title=${encodeURIComponent(item.title)}`
			})
		},
		
		async startQuickReview(type) {
			uni.showLoading({ title: '正在获取题目...' });
			let questions = [];
			let pageTitle = '';

			try {
				let response;
				if (type === 'weak') {
					pageTitle = '薄弱点专练';
					response = await getWrongQuestions({ limit: 20 });
				} else if (type === 'random') {
					pageTitle = '随机复习';
					response = await getPracticeQuestions({ limit: 20, random: true });
				}

				if (response && response.success && response.data && response.data.length > 0) {
					questions = response.data;
				} else {
					console.warn('API failed or returned no data, falling back to mock questions.');
					questions = this.generateMockQuestions(type);
					if (questions.length === 0) {
						uni.showToast({ title: '暂无相关题目', icon: 'none' });
						return;
					}
				}
			} catch (error) {
				console.error('API request failed, falling back to mock questions:', error);
				questions = this.generateMockQuestions(type);
				pageTitle = type === 'weak' ? '薄弱点专练 (模拟)' : '随机复习 (模拟)';
			} finally {
				uni.hideLoading();
			}

			if (questions.length === 0) {
                uni.showToast({ title: '未能获取到题目', icon: 'none' });
                return;
            }

			uni.setStorageSync('examSessionConfig', {
				pageTitle: pageTitle,
				questions: questions,
				mode: 'practice'
			});

			uni.navigateTo({
				url: '/pages/exam/session'
			});
		},

		generateMockQuestions(type) {
			const count = 10;
			const questions = [];
			const subject = type === 'weak' ? '薄弱知识点' : '随机知识点';
			for (let i = 0; i < count; i++) {
				questions.push({
					id: 9000 + i + 1,
					type: 'single',
					content: `${subject}模拟题：这是第${i + 1}道模拟题。`,
					options: ['模拟选项A', '模拟选项B', '模拟选项C', '模拟选项D'],
					answer: Math.floor(Math.random() * 4),
					explanation: `这是模拟题的解析。`,
					score: 2
				});
			}
			return questions;
		}
	}
}
</script>

<style scoped>
.review-container {
	background: linear-gradient(135deg, var(--accent, #667eea) 0%, var(--accent-dark, #764ba2) 100%);
	min-height: 100vh;
	padding-bottom: 20rpx;
}

/* 头部 */
.review-header {
	display: flex;
	align-items: center;
	padding: 40rpx 30rpx 30rpx;
	background: transparent;
}

.back-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	background-color: var(--back-button-bg, rgba(255, 255, 255, 0.2));
	margin-right: 20rpx;
}

.back-icon {
	font-size: 32rpx;
	color: var(--card-bg, white);
	font-weight: bold;
}

.header-title {
	font-size: 36rpx;
	font-weight: bold;
	color: var(--card-bg, white);
}

/* 概览卡 */
.progress-overview {
	padding: 0 30rpx 30rpx;
}

.overview-card {
	background: var(--overview-card-bg, rgba(255, 255, 255, 0.15));
	border-radius: 20rpx;
	padding: 30rpx;
	display: flex;
	justify-content: space-around;
	backdrop-filter: blur(10rpx);
}

.overview-item {
	text-align: center;
}

.overview-number {
	display: block;
	font-size: 48rpx;
	font-weight: bold;
	color: var(--card-bg, white);
	margin-bottom: 8rpx;
}

.overview-label {
	font-size: 24rpx;
	color: var(--overview-label-color, rgba(255, 255, 255, 0.8));
}

/* 内容区 */
.knowledge-categories {
	background: var(--card-bg, white);
	border-radius: 30rpx 30rpx 0 0;
	padding: 40rpx 30rpx 30rpx;
	margin-top: 20rpx;
}

.section-title {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}

.title-text {
	font-size: 32rpx;
	font-weight: bold;
	color: var(--text-primary, #333);
	margin-left: 12rpx;
}

.categories-grid {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.category-card {
	background: var(--card-bg, white);
	border-radius: 16rpx;
	padding: 24rpx;
	box-shadow: var(--shadow, 0 4rpx 20rpx rgba(0, 0, 0, 0.08));
	border: 2rpx solid var(--border-color, #f0f0f0);
	transition: all 0.3s ease;
}

.category-card.completed {
	border-color: var(--accent, #4A90E2);
	background: linear-gradient(135deg, var(--card-bg-2, #f8fbff) 0%, var(--card-bg-3, #e8f4ff) 100%);
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16rpx;
}

.progress-badge {
	background: var(--accent, #4A90E2);
	color: var(--card-bg, white);
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	font-size: 22rpx;
	font-weight: bold;
}

.category-card.completed .progress-badge {
	background: var(--success, #52c41a);
}

.card-content {
	margin-bottom: 20rpx;
}

.category-title {
	font-size: 28rpx;
	font-weight: bold;
	color: var(--text-primary, #333);
	margin-bottom: 8rpx;
	display: block;
}

.category-desc {
	font-size: 24rpx;
	color: var(--text-secondary, #666);
	line-height: 1.4;
	margin-bottom: 12rpx;
	display: block;
}

.knowledge-stats {
	background: var(--border-color, #f8f9fa);
	padding: 8rpx 12rpx;
	border-radius: 8rpx;
	display: inline-block;
}

.stats-text {
	font-size: 22rpx;
	color: var(--accent, #4A90E2);
	font-weight: bold;
}

.card-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.progress-bar {
	flex: 1;
	height: 8rpx;
	background: var(--border-color, #f0f0f0);
	border-radius: 4rpx;
	margin-right: 16rpx;
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, var(--accent, #4A90E2) 0%, var(--accent-dark, #357ABD) 100%);
	border-radius: 4rpx;
	transition: width 0.3s ease;
}

.category-card.completed .progress-fill {
	background: linear-gradient(90deg, var(--success, #52c41a) 0%, #389e0d 100%);
}

.status-text {
	font-size: 22rpx;
	color: var(--text-secondary, #666);
	font-weight: bold;
}

/* 最近学习 */
.recent-study {
	background: var(--card-bg, white);
	padding: 30rpx;
}

.recent-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.recent-item {
	display: flex;
	align-items: center;
	padding: 20rpx;
	background: var(--border-color, #f8f9fa);
	border-radius: 12rpx;
	border-left: 4rpx solid var(--accent, #4A90E2);
}

.recent-icon {
	margin-right: 16rpx;
}

.recent-content {
	flex: 1;
}

.recent-title {
	font-size: 26rpx;
	color: var(--text-primary, #333);
	font-weight: bold;
	margin-bottom: 4rpx;
	display: block;
}

.recent-time {
	font-size: 22rpx;
	color: var(--text-secondary, #999);
}

.recent-progress {
	text-align: right;
}

.progress-num {
	font-size: 22rpx;
	color: var(--accent, #4A90E2);
	font-weight: bold;
	display: block;
	margin-bottom: 4rpx;
}

.mini-progress {
	width: 60rpx;
	height: 4rpx;
	background: var(--border-color, #f0f0f0);
	border-radius: 2rpx;
	overflow: hidden;
}

.mini-fill {
	height: 100%;
	background: var(--accent, #4A90E2);
	border-radius: 2rpx;
}

/* 快速复习 */
.quick-review {
	background: var(--card-bg, white);
	padding: 30rpx;
}

.quick-actions {
	display: flex;
	gap: 16rpx;
}

.action-card {
	flex: 1;
	background: var(--card-bg, white);
	border-radius: 16rpx;
	padding: 24rpx;
	text-align: center;
	box-shadow: var(--shadow, 0 4rpx 20rpx rgba(0, 0, 0, 0.08));
	border: 2rpx solid var(--border-color, #f0f0f0);
}

.action-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 16rpx;
}

.action-icon.weak {
	background: linear-gradient(135deg, var(--warning, #ff9a56) 0%, var(--danger, #ff6b35) 100%);
}

.action-icon.random {
	background: linear-gradient(135deg, var(--accent-dark, #a78bfa) 0%, var(--accent, #8b5cf6) 100%);
}

.action-title {
	font-size: 26rpx;
	font-weight: bold;
	color: var(--text-primary, #333);
	margin-bottom: 8rpx;
	display: block;
}

.action-desc {
	font-size: 22rpx;
	color: var(--text-secondary, #666);
	line-height: 1.4;
}
</style>
