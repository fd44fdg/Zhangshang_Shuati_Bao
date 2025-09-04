
<template>
	<view class="practice-container">
		<!-- 配置模式 -->
		<view class="setup-mode">
			<view class="header">
				<text class="header-title">{{ pageTitle || '刷题练习' }}</text>
			</view>
			
			<!-- 模式提示卡片 -->
			<view v-if="currentMode" class="mode-tip-card">
				<view class="mode-icon">{{ getModeIcon() }}</view>
				<view class="mode-content">
					<text class="mode-title">{{ getModeTitle() }}</text>
					<text class="mode-desc">{{ getModeDescription() }}</text>
				</view>
			</view>
			
			<view class="content-section">
				<view class="info-card">
					<text class="info-text">选择你想要练习的题目类型和难度，开始刷题吧！</text>
				</view>
				
				<view class="section">
					<view class="section-title">选择分类</view>
					<view class="category-list">
						<view 
							v-for="(category, index) in categories" 
							:key="index"
							class="category-item"
							:class="{ active: selectedCategory === index }"
							@click="selectCategory(index)"
						>
							<text class="category-name">{{ category }}</text>
						</view>
					</view>
				</view>
				
				<view class="section">
					<view class="section-title">选择难度</view>
					<view class="difficulty-list">
						<view 
							v-for="(difficulty, index) in difficulties" 
							:key="index"
							class="difficulty-item"
							:class="{ active: selectedDifficulty === index }"
							@click="selectDifficulty(index)"
						>
							<text class="difficulty-name">{{ difficulty.name }}</text>
							<text class="difficulty-desc">{{ difficulty.desc }}</text>
						</view>
					</view>
				</view>
				
				<view class="section">
					<view class="section-title">题目数量</view>
					<slider 
						:value="questionCount" 
						:min="5" 
						:max="50" 
						:step="5" 
						:show-value="true"
						@change="onQuestionCountChange"
					/>
				</view>
				
				<view class="button-section">
					<button class="start-button" @click="startPractice">开始练习</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			// 配置数据
			categories: ['数学', '语文', '英语', '物理', '化学', '生物'],
			difficulties: [
				{ name: '简单', desc: '基础题型，适合入门' },
				{ name: '中等', desc: '标准题型，适合巩固' },
				{ name: '困难', desc: '挑战题型，适合提高' }
			],
			selectedCategory: 0,
			selectedDifficulty: 1,
			questionCount: 20,
			
			// 当前模式
			currentMode: '',
			pageTitle: '',

			// 用户设置
			userSettings: null
		}
	},
	onLoad(options) {
		console.log('Practice页面onLoad - 接收到的参数:', options)

		// 确保options对象存在
		if (!options) {
			options = {}
			console.log('options为空，使用默认值')
		}

		// 加载用户设置并应用默认值
		this.loadUserSettings()

		// 处理分类参数
		if (options.category) {
			const categoryIndex = this.categories.indexOf(options.category)
			if (categoryIndex !== -1) {
				this.selectedCategory = categoryIndex
				console.log('设置分类索引:', categoryIndex)
			}
		}

		// 处理URL参数中的模式
		this.handleModeFromOptions(options)
	},
	
	onShow() {
		console.log('Practice页面onShow - 检查存储的模式参数')
		
		// 检查是否有存储的模式参数
		const storedMode = uni.getStorageSync('practiceMode')
		if (storedMode) {
			console.log('从存储读取到模式参数:', storedMode)
			this.handleModeFromOptions(storedMode)
			// 清除存储的参数，避免重复使用
			uni.removeStorageSync('practiceMode')
		}
	},
	methods: {
		// 加载用户设置
		loadUserSettings() {
			try {
				const settings = uni.getStorageSync('app_settings')
				if (settings) {
					// 应用默认难度设置
					if (settings.difficulty) {
						const difficultyMap = { 'easy': 0, 'medium': 1, 'hard': 2 }
						this.selectedDifficulty = difficultyMap[settings.difficulty] || 1
						console.log('应用默认难度设置:', settings.difficulty, '→', this.selectedDifficulty)
					}

					// 应用默认题数设置
					if (settings.questionCount) {
						this.questionCount = settings.questionCount
						console.log('应用默认题数设置:', settings.questionCount)
					}

					// 保存设置供答题时使用
					this.userSettings = settings
					console.log('用户设置已加载:', settings)
				}
			} catch (error) {
				console.error('加载用户设置失败:', error)
			}
		},

		selectCategory(index) {
			this.selectedCategory = index
		},
		selectDifficulty(index) {
			this.selectedDifficulty = index
		},
        onQuestionCountChange(e) {
			this.questionCount = e.detail.value
		},
		
		// 开始练习：跳转到统一的会话页面
		async startPractice() {
			try {
				// 将当前练习的配置写入本地存储，供会话页面读取
				uni.setStorageSync('examSessionConfig', {
					pageTitle: '刷题练习',
					selectedSubjectIndex: this.selectedCategory,
					selectedDifficultyIndex: this.selectedDifficulty, // 将难度传递过去
					questionCount: this.questionCount,
					mode: 'practice' // 明确指定为练习模式
				})
				
				// 跳转到统一的会话页面
				uni.navigateTo({
					url: '/pages/exam/session'
				})
			} catch (error) {
				uni.showToast({
					title: '进入练习失败，请重试',
					icon: 'none'
				})
			}
		},
		
		// 处理模式参数
		handleModeFromOptions(options) {
			if (!options || !options.mode) {
				console.log('没有模式参数，使用默认模式')
				return
			}
			
			console.log('处理模式参数:', options.mode)
			this.currentMode = options.mode
			
			switch(options.mode) {
				case 'popular':
					console.log('初始化热门题目模式')
					this.selectedDifficulty = 1
					this.questionCount = 20
					this.pageTitle = '热门题目练习'
					uni.setNavigationBarTitle({ title: '热门题目练习' })
					break
				case 'daily':
					console.log('初始化每日一题模式')
					this.selectedDifficulty = Math.floor(Math.random() * 3)
					this.questionCount = 10
					this.pageTitle = '每日一题'
					uni.setNavigationBarTitle({ title: '每日一题' })
					break
				case 'review':
					console.log('初始化知识点复习模式')
					this.selectedDifficulty = 0
					this.questionCount = 30
					this.pageTitle = '知识点复习'
					uni.setNavigationBarTitle({ title: '知识点复习' })
					// 注意：知识点复习不自动开始，需要用户配置
					break
				default:
					console.log('未知模式:', options.mode)
			}
			
			// 检查是否需要自动开始（只有热门题目和每日一题才自动开始）
			if ((options.autoStart === true || options.autoStart === 'true') && 
			    (options.mode === 'popular' || options.mode === 'daily')) {
				console.log('自动开始练习')
				setTimeout(() => {
					this.startPractice()
				}, 800)
			}
			
			console.log('模式处理完成 - 当前状态:', {
				currentMode: this.currentMode,
				pageTitle: this.pageTitle,
				selectedDifficulty: this.selectedDifficulty,
				questionCount: this.questionCount
			})
		},
		getCurrentModePrefix() {
			switch(this.currentMode) {
				case 'popular':
					return '🔥热门 - '
				case 'daily':
					return '⭐每日 - '
				case 'review':
					return '📚复习 - '
				default:
					return ''
			}
		},
		
		// 获取模式图标
		getModeIcon() {
			switch(this.currentMode) {
				case 'popular':
					return '🔥'
				case 'daily':
					return '⭐'
				case 'review':
					return '📚'
				default:
					return '📝'
			}
		},
		
		// 获取模式标题
		getModeTitle() {
			switch(this.currentMode) {
				case 'popular':
					return '热门题目练习'
				case 'daily':
					return '每日一题挑战'
				case 'review':
					return '知识点复习'
				default:
					return '自由练习'
			}
		},
		
		// 获取模式描述
		getModeDescription() {
			switch(this.currentMode) {
				case 'popular':
					return '精选热门题目，提升实战能力'
				case 'daily':
					return '每日一道精心选择的题目'
				case 'review':
					return '系统性复习重点知识'
				default:
					return '根据您的需要自由配置'
			}
		}
	}
}
</script>

<style>
.practice-container {
	padding: 20rpx;
	background-color: var(--bg-color, #f5f5f5);
	min-height: 100vh;
}

/* 配置模式样式 */
.header {
	display: flex;
	align-items: center;
	padding: 30rpx;
	background-color: var(--card-bg, #fff);
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	justify-content: center; /* 居中显示标题 */
}

.header-title {
	font-size: 36rpx;
	font-weight: bold;
	color: var(--text-primary, #333);
}

/* 模式提示卡片 */
.mode-tip-card {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 20rpx rgba(102, 126, 234, 0.3);
}

.mode-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}

.mode-content {
	flex: 1;
}

.mode-title {
	color: white;
	font-size: 32rpx;
	font-weight: bold;
	margin-bottom: 8rpx;
	display: block;
}

.mode-desc {
	color: rgba(255, 255, 255, 0.9);
	font-size: 24rpx;
	line-height: 1.4;
}

.content-section {
	margin-bottom: 20rpx;
}

.info-card {
	background-color: #4A90E2;
	padding: 30rpx;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
}

.info-text {
	color: #fff;
	font-size: 28rpx;
	line-height: 1.5;
}

.section {
	background-color: var(--card-bg, #fff);
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.section-title {
	font-size: 30rpx;
	font-weight: bold;
	color: var(--text-primary, #333);
	margin-bottom: 20rpx;
}

.category-list {
	display: flex;
	flex-wrap: wrap;
	margin: 0 -10rpx;
}

.category-item {
	width: calc(33.33% - 20rpx);
	margin: 10rpx;
	padding: 20rpx 0;
	background-color: var(--card-bg-2, #f9f9f9);
	border-radius: 12rpx;
	text-align: center;
}

.category-item.active {
	background-color: #4A90E2;
}

.category-name {
	font-size: 28rpx;
	color: var(--text-primary, #333);
}

.category-item.active .category-name {
	color: #fff;
}

.difficulty-list {
	display: flex;
	flex-direction: column;
}

.difficulty-item {
	padding: 20rpx;
	background-color: var(--card-bg-2, #f9f9f9);
	border-radius: 12rpx;
	margin-bottom: 15rpx;
}

.difficulty-item.active {
	background-color: #4A90E2;
}

.difficulty-name {
	font-size: 28rpx;
	font-weight: bold;
	color: var(--text-primary, #333);
	margin-bottom: 5rpx;
	display: block;
}

.difficulty-desc {
	font-size: 24rpx;
	color: var(--text-secondary, #999);
}

.difficulty-item.active .difficulty-name,
.difficulty-item.active .difficulty-desc {
	color: #fff;
}

.button-section {
	margin-top: 40rpx;
}

.start-button {
	background-color: #4A90E2;
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
	border-radius: 45rpx;
	padding: 25rpx 0;
}
</style>
