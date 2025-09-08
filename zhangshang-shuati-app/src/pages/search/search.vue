<template>
	<view class="search-container">
		<!-- 搜索头部 -->
		<view class="search-header">
			<view class="search-box">
				<view class="search-input-wrapper">
					<text class="search-icon">🔍</text>
					<input 
						class="search-input" 
						v-model="searchKeyword" 
						placeholder="搜索知识点、题目或文章"
						@input="onSearchInput"
						@confirm="handleSearch"
						confirm-type="search"
					/>
					<view v-if="searchKeyword" class="clear-btn" @click="clearSearch">
						<text class="clear-icon">×</text>
					</view>
				</view>
				<view class="search-btn" @click="handleSearch">
					<text class="search-btn-text">搜索</text>
				</view>
			</view>
			
			<!-- 搜索过滤器 -->
			<scroll-view class="filter-scroll" scroll-x="true" show-scrollbar="false">
				<view class="filter-list">
					<view 
						v-for="filter in searchFilters" 
						:key="filter.key"
						class="filter-item" 
						:class="{active: selectedFilter === filter.key}"
						@click="selectFilter(filter.key)"
					>
						<text class="filter-text">{{filter.label}}</text>
					</view>
				</view>
			</scroll-view>
		</view>
		
		<!-- 搜索历史 -->
		<view v-if="!searchKeyword && searchHistory.length > 0" class="search-history">
			<view class="history-header">
				<text class="history-title">搜索历史</text>
				<text class="clear-history" @click="clearHistory">清空</text>
			</view>
			<view class="history-list">
				<view 
					v-for="(item, index) in searchHistory" 
					:key="index"
					class="history-item" 
					@click="selectHistoryItem(item)"
				>
					<text class="history-icon">🕒</text>
					<text class="history-text">{{item}}</text>
					<text class="delete-icon" @click.stop="deleteHistoryItem(index)">×</text>
				</view>
			</view>
		</view>
		
		<!-- 热门搜索 -->
		<view v-if="!searchKeyword" class="hot-search">
			<view class="hot-header">
				<text class="hot-title">热门搜索</text>
			</view>
			<view class="hot-list">
				<view 
					v-for="(item, index) in hotSearches" 
					:key="index"
					class="hot-item" 
					@click="selectHotSearch(item)"
				>
					<text class="hot-text">{{item}}</text>
				</view>
			</view>
		</view>
		
		<!-- 搜索结果 -->
		<view v-if="searchKeyword" class="search-results">
			<!-- 骨架屏 -->
			<view v-if="loading" class="skeleton-wrapper">
				<view v-for="n in 5" :key="n" class="skeleton-item">
					<view class="skeleton-line w60"></view>
					<view class="skeleton-line w90"></view>
					<view class="skeleton-line w40"></view>
				</view>
			</view>
			
			<view v-else-if="searchResults.length === 0" class="empty-container">
				<text class="empty-icon">🔍</text>
				<text class="empty-text">未找到相关内容</text>
				<text class="empty-tip">试试其他关键词吧</text>
			</view>
			
			<view v-else class="results-list">
				<view class="results-header">
					<text class="results-count">共 {{ total }} 条结果</text>
				</view>
				
				<view 
					v-for="item in filteredResults" 
					:key="item.id"
					class="result-item" 
					@click="handleResultClick(item)"
				>
					<view class="result-header">
						<view class="result-type" :style="{backgroundColor: getTypeColor(item.type)}">
							<text class="type-text">{{getTypeLabel(item.type)}}</text>
						</view>
						<view v-if="item.difficulty" class="difficulty-tag">
							<text class="difficulty-text">{{getDifficultyText(item.difficulty)}}</text>
						</view>
					</view>
					
					<view class="result-content">
						<view class="result-title hl-line">
							<text v-for="(seg,i) in highlightSegments(item.title)" :key="i" :class="['seg', seg.hl ? 'hl':'']">{{ seg.t }}</text>
						</view>
						<view class="result-description hl-line">
							<text v-for="(seg,i) in highlightSegments(item.description)" :key="i" :class="['seg', seg.hl ? 'hl':'']">{{ seg.t }}</text>
						</view>
					</view>
					
					<view class="result-footer">
						<view class="result-meta">
							<text class="meta-text">{{item.category}}</text>
							<text v-if="item.questionCount" class="meta-text">{{item.questionCount}}题</text>
							<text v-if="item.readTime" class="meta-text">{{item.readTime}}分钟阅读</text>
						</view>
						<text class="result-arrow">></text>
					</view>
				</view>
				<!-- 底部加载状态 -->
				<view class="load-more-status" v-if="!loading">
					<text v-if="loadingMore" class="status-text">加载中...</text>
					<text v-else-if="hasMore" class="status-action" @click="loadMore">点击加载更多</text>
					<text v-else class="status-done">没有更多了</text>
				</view>
			</view>
		</view>
		
		<!-- 回到顶部按钮 -->
		<BackToTop v-if="searchResults.length > 5" />
	</view>
</template>

<script>
import BackToTop from '@/components/BackToTop/index.vue'
import { searchKnowledgePoints } from '@/api/knowledge.js'

export default {
	components: { BackToTop },
	data() {
		return {
			searchKeyword: '',
			loading: false,
			loadingMore: false,
			searchResults: [],
			total: 0,
			page: 1,
			pageSize: 30,
			hasMore: false,
			selectedFilter: 'all',
			searchFilters: [
				{ key: 'all', label: '全部' },
				{ key: 'knowledge', label: '知识点' },
				{ key: 'question', label: '题目' },
				{ key: 'article', label: '文章' }
			],
			searchHistory: [],
			hotSearches: [
				'JavaScript闭包',
				'CSS布局',
				'性能优化',
				'Vue组件',
				'Node.js'
			],
			searchTimer: null
		}
	},
	computed: {
		filteredResults() {
			if (this.selectedFilter === 'all') return this.searchResults
			return this.searchResults.filter(r => r.type === this.selectedFilter)
		}
	},
	onLoad() {
		this.loadSearchHistory()
	},
	methods: {
		onSearchInput() {
			clearTimeout(this.searchTimer)
			const kw = this.searchKeyword.trim()
			if (!kw) {
				this.searchResults = []
				return
			}
			this.searchTimer = setTimeout(() => {
				this.performSearch()
			}, 400)
		},
			async performSearch(reset = true) {
			const kw = this.searchKeyword.trim()
			if (!kw) {
				uni.showToast({ title: '请输入关键词', icon: 'none' })
				return
			}
			if (this.selectedFilter !== 'all' && this.selectedFilter !== 'knowledge') {
				uni.showToast({ title: '当前仅支持知识点', icon: 'none' })
				return
			}
			  if (reset) {
				this.page = 1
				this.searchResults = []
				this.hasMore = false
				this.total = 0
				this.loading = true
			  } else {
				this.loadingMore = true
			  }
			  try {
				const resp = await searchKnowledgePoints({ keyword: kw, page: this.page, limit: this.pageSize })
				let list = []
				if (resp && resp.data) {
				  if (Array.isArray(resp.data)) list = resp.data
				  else if (Array.isArray(resp.data.items)) list = resp.data.items
				  else if (Array.isArray(resp.data.list)) list = resp.data.list
				  if (resp.data.total) this.total = resp.data.total
				}
				if (!this.total && resp && resp.data && typeof resp.data.total === 'number') this.total = resp.data.total
				if (!this.total) this.total = this.page === 1 ? list.length : this.searchResults.length + list.length
				this.hasMore = this.searchResults.length + list.length < this.total
				// 标准化、去重
				const mapped = list.map(item => ({
				  id: item.id,
				  title: item.title || item.name || '未命名',
				  description: item.description || '',
				  category: item.category || item.category_name || '未分类',
				  difficulty: item.difficulty || item.level || '',
				  questionCount: item.questionCount || item.questions_count || 0,
				  type: 'knowledge'
				}))
				this.searchResults = (reset ? [] : this.searchResults).concat(mapped).reduce((acc, cur) => {
				  if (!acc.find(x => x.id === cur.id)) acc.push(cur)
				  return acc
				}, [])
				this.saveSearchHistory(kw)
				if (!this.searchResults.length) {
				  uni.showToast({ title: '无结果', icon: 'none' })
				} else if (reset) {
				  uni.showToast({ title: `共${this.total}条`, icon: 'success' })
				}
			  } catch (e) {
				console.error('搜索失败', e)
				this.searchResults = []
				uni.showToast({ title: '搜索出错', icon: 'none' })
			  } finally {
				this.loading = false
				this.loadingMore = false
			  }
		},
		loadMore() {
			if (!this.hasMore || this.loading || this.loadingMore) return
			this.page += 1
			this.performSearch(false)
		},
		clearSearch() {
			this.searchKeyword = ''
			this.searchResults = []
			clearTimeout(this.searchTimer)
		},
		selectFilter(key) {
			this.selectedFilter = key
		if (this.searchKeyword.trim()) this.performSearch(true)
		},
		selectHistoryItem(kw) {
			this.searchKeyword = kw
			this.performSearch()
		},
		selectHotSearch(kw) {
			this.searchKeyword = kw
			this.performSearch()
		},
		deleteHistoryItem(idx) {
			this.searchHistory.splice(idx, 1)
			this.saveSearchHistoryToStorage()
		},
		clearHistory() {
			uni.showModal({
				title: '确认清空',
				content: '确定清空搜索历史？',
				success: res => {
					if (res.confirm) {
						this.searchHistory = []
						this.saveSearchHistoryToStorage()
					}
				}
			})
		},
		saveSearchHistory(kw) {
			const i = this.searchHistory.indexOf(kw)
			if (i > -1) this.searchHistory.splice(i, 1)
			this.searchHistory.unshift(kw)
			if (this.searchHistory.length > 10) this.searchHistory = this.searchHistory.slice(0, 10)
			this.saveSearchHistoryToStorage()
		},
		loadSearchHistory() {
			try {
				const raw = uni.getStorageSync('searchHistory')
				if (raw) this.searchHistory = JSON.parse(raw)
			} catch (e) {
				console.warn('加载历史失败', e)
			}
		},
		saveSearchHistoryToStorage() {
			try { uni.setStorageSync('searchHistory', JSON.stringify(this.searchHistory)) } catch (e) {}
		},
		handleResultClick(item) {
			if (item.type === 'knowledge') {
				uni.navigateTo({ url: `/pages/knowledge/detail?id=${item.id}` })
			} else {
				uni.showToast({ title: '暂未支持', icon: 'none' })
			}
		},
			onReachBottom() {
				if (!this.hasMore || this.loading || this.loadingMore) return
				this.page += 1
				this.performSearch(false)
			},
		getTypeColor(type) {
			const map = { knowledge: 'var(--type-knowledge, #4A90E2)', question: 'var(--type-question, #52C41A)', article: 'var(--type-article, #FA8C16)' }
			return map[type] || 'var(--muted, #999999)'
		},
			
		getTypeLabel(type) {
			const map = { knowledge: '知识点', question: '题目', article: '文章' }
			return map[type] || '未知'
		},
		getDifficultyText(d) {
			const dm = { 1: '入门', 2: '初级', 3: '中级', 4: '高级', 5: '专家' }
			return dm[d] || ''
		},
		highlightSegments(text) {
			const kw = this.searchKeyword.trim()
			if (!text) return []
			if (!kw) return [{ t: text, hl: false }]
			// 简单拆分（忽略大小写）
			const parts = []
			const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig')
			let lastIndex = 0
			let m
			while ((m = regex.exec(text)) !== null) {
				if (m.index > lastIndex) parts.push({ t: text.slice(lastIndex, m.index), hl: false })
				parts.push({ t: m[0], hl: true })
				lastIndex = m.index + m[0].length
			}
			if (lastIndex < text.length) parts.push({ t: text.slice(lastIndex), hl: false })
			return parts
		}
	}
}
</script>

<style scoped>
	.search-container {
		padding: 20rpx;
		background-color: var(--bg-color, #f5f5f5);
		min-height: 100vh;
	}
	
	/* 搜索头部 */
	.search-header {
		background-color: var(--card-bg, #ffffff);
		border-radius: 16rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: var(--shadow, 0 4rpx 12rpx rgba(0,0,0,0.1));
	}
	
	.search-box {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}
	
	.search-input-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		background-color: var(--border-color, #f8f9fa);
		border-radius: 25rpx;
		padding: 0 20rpx;
		margin-right: 20rpx;
	}
	
	.search-icon {
		font-size: 32rpx;
		color: var(--text-secondary, #999999);
		margin-right: 15rpx;
	}
	
	.search-input {
		flex: 1;
		height: 80rpx;
		font-size: 28rpx;
		color: var(--text-primary, #333333);
		background-color: transparent;
		border: none;
		outline: none;
	}
	
	.clear-btn {
		width: 40rpx;
		height: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--muted, #cccccc);
		border-radius: 50%;
	}
	
	.clear-icon {
		font-size: 24rpx;
		color: var(--card-bg, #ffffff);
	}
	
	.search-btn {
		padding: 20rpx 30rpx;
		background-color: var(--accent, #4A90E2);
		border-radius: 25rpx;
	}
	
	.search-btn-text {
		font-size: 28rpx;
		color: var(--card-bg, #ffffff);
		font-weight: bold;
	}
	
	/* 过滤器 */
	.filter-scroll {
		margin-top: 20rpx;
	}
	
	.filter-list {
		display: flex;
		white-space: nowrap;
	}
	
	.filter-item {
		padding: 15rpx 30rpx;
		margin-right: 20rpx;
		background-color: var(--border-color, #f8f9fa);
		border-radius: 20rpx;
		border: 2rpx solid transparent;
		transition: all 0.3s ease;
	}
	
	.filter-item.active {
		background-color: var(--accent, #4A90E2);
		border-color: var(--accent, #4A90E2);
	}
	
	.filter-text {
		font-size: 24rpx;
		color: var(--text-secondary, #666666);
	}
	
	.filter-item.active .filter-text {
		color: var(--card-bg, #ffffff);
	}
	
	/* 搜索历史 */
	.search-history {
		background-color: var(--card-bg, #ffffff);
		border-radius: 16rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: var(--shadow, 0 4rpx 12rpx rgba(0,0,0,0.1));
	}
	
	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}
	
	.history-title {
		font-size: 28rpx;
		font-weight: bold;
		color: var(--text-primary, #333333);
	}
	
	.clear-history {
		font-size: 24rpx;
		color: var(--text-secondary, #999999);
	}
	
	.history-list {
		display: flex;
		flex-direction: column;
	}
	
	.history-item {
		display: flex;
		align-items: center;
		padding: 20rpx 0;
		border-bottom: 1rpx solid var(--border-color, #f0f0f0);
	}
	
	.history-item:last-child {
		border-bottom: none;
	}
	
	.history-icon {
		font-size: 28rpx;
		color: var(--text-secondary, #999999);
		margin-right: 20rpx;
	}
	
	.history-text {
		flex: 1;
		font-size: 26rpx;
		color: var(--text-primary, #333333);
	}
	
	.delete-icon {
		font-size: 32rpx;
		color: var(--muted, #cccccc);
		padding: 10rpx;
	}
	
	/* 热门搜索 */
	.hot-search {
		background-color: var(--card-bg, #ffffff);
		border-radius: 16rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: var(--shadow, 0 4rpx 12rpx rgba(0,0,0,0.1));
	}
	
	.hot-header {
		margin-bottom: 20rpx;
	}
	
	.hot-title {
		font-size: 28rpx;
		font-weight: bold;
		color: var(--text-primary, #333333);
	}
	
	.hot-list {
		display: flex;
		flex-wrap: wrap;
	}
	
	.hot-item {
		padding: 15rpx 25rpx;
		margin-right: 20rpx;
		margin-bottom: 20rpx;
		background-color: var(--border-color, #f8f9fa);
		border-radius: 20rpx;
		border: 1rpx solid var(--muted-border, #e9ecef);
	}
	
	.hot-text {
		font-size: 24rpx;
		color: var(--text-secondary, #666666);
	}
	
	/* 搜索结果 */
	.search-results {
		margin-bottom: 30rpx;
	}
	
	.loading-container,
	.empty-container {
		padding: 100rpx 0;
		text-align: center;
		background-color: var(--card-bg, #ffffff);
		border-radius: 16rpx;
		box-shadow: var(--shadow, 0 4rpx 12rpx rgba(0,0,0,0.1));
	}
	
	.loading-text {
		font-size: 28rpx;
		color: var(--text-secondary, #999999);
	}
	
	.empty-icon {
		font-size: 80rpx;
		color: var(--muted, #cccccc);
		display: block;
		margin-bottom: 20rpx;
	}
	
	.empty-text {
		font-size: 28rpx;
		color: var(--text-secondary, #999999);
		display: block;
		margin-bottom: 10rpx;
	}
	
	.empty-tip {
		font-size: 24rpx;
		color: var(--muted, #cccccc);
		display: block;
	}
	
	.results-list {
		background-color: var(--card-bg, #ffffff);
		border-radius: 16rpx;
		padding: 30rpx;
		box-shadow: var(--shadow, 0 4rpx 12rpx rgba(0,0,0,0.1));
	}
	
	.results-header {
		margin-bottom: 30rpx;
	}
	
	.results-count {
		font-size: 24rpx;
		color: var(--text-secondary, #999999);
	}
	
	.result-item {
		padding: 30rpx 0;
		border-bottom: 1rpx solid var(--border-color, #f0f0f0);
	}
	
	.result-item:last-child {
		border-bottom: none;
	}
	
	.result-header {
		display: flex;
		align-items: center;
		margin-bottom: 15rpx;
	}
	
	.result-type {
		padding: 8rpx 16rpx;
		border-radius: 12rpx;
		margin-right: 15rpx;
	}
	
	.type-text {
		font-size: 20rpx;
		color: var(--card-bg, #ffffff);
		font-weight: bold;
	}
	
	.difficulty-tag {
		padding: 8rpx 16rpx;
		background-color: var(--border-color, #f8f9fa);
		border-radius: 12rpx;
		border: 1rpx solid var(--muted-border, #e9ecef);
	}
	
	.difficulty-text {
		font-size: 20rpx;
		color: var(--text-secondary, #666666);
	}
	
	.result-content {
		margin-bottom: 15rpx;
	}
	
	.result-title {
		font-size: 30rpx;
		font-weight: bold;
		color: var(--text-primary, #333333);
		display: block;
		margin-bottom: 10rpx;
	}
	
	.result-description {
		font-size: 26rpx;
		color: var(--text-secondary, #666666);
		line-height: 1.5;
		display: block;
	}

	/* 骨架屏 */
	.skeleton-wrapper { background: var(--card-bg,#fff); border-radius:16rpx; padding:30rpx; box-shadow:var(--shadow,0 4rpx 12rpx rgba(0,0,0,0.08)); }
	.skeleton-item { margin-bottom:28rpx; }
	.skeleton-line { height: 28rpx; background: linear-gradient(90deg,#eee 25%,#f5f5f5 37%,#eee 63%); background-size:400% 100%; border-radius: 8rpx; animation: skeleton-loading 1.4s ease infinite; margin-bottom:14rpx; }
	.skeleton-line.w60 { width:60%; }
	.skeleton-line.w90 { width:90%; }
	.skeleton-line.w40 { width:40%; }
	@keyframes skeleton-loading { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

	/* 高亮 */
	.hl-line { display:flex; flex-wrap:wrap; }
	.hl-line .seg { font-size: inherit; }
	.hl-line .seg.hl { color: #d4380d; font-weight:600; }

	/* 底部加载状态 */
	.load-more-status { text-align:center; padding:30rpx 0 10rpx; color: var(--text-secondary,#999); font-size:24rpx; }
	.status-action { color: var(--accent,#4A90E2); }
	.status-done { color: var(--muted,#ccc); }
	
	.result-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.result-meta {
		display: flex;
		align-items: center;
	}
	
	.meta-text {
		font-size: 22rpx;
		color: var(--text-secondary, #999999);
		margin-right: 20rpx;
	}
	
	.result-arrow {
		font-size: 24rpx;
		color: var(--muted, #cccccc);
	}
</style>