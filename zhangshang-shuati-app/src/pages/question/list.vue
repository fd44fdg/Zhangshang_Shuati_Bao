
<template>
  <view class="question-list-container">
    <uni-list>
      <uni-list-item
        v-for="question in questions"
        :key="question.id"
        :title="question.title"
        :note="`分类: ${question.category_name} | 难度: ${question.difficulty}`"
        show-arrow
        clickable
        @click="navigateToDetail(question.id)"
      />
    </uni-list>
    <view v-if="loading" class="loading-container">
      <uni-load-more :status="status"></uni-load-more>
    </view>
    <view v-if="!loading && questions.length === 0" class="empty-container">
      <text>该知识点下暂无题目</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import { getQuestions } from '@/api/question'

const questions = ref([])
const knowledgePointId = ref(null)
const loading = ref(true)
const status = ref('loading')

const queryParams = ref({
  page: 1,
  limit: 20,
  knowledge_point_id: null
})

const hasMore = ref(true)

onLoad((options) => {
  knowledgePointId.value = options.knowledgePointId
  queryParams.value.knowledge_point_id = options.knowledgePointId
  // Optionally set the title based on the knowledge point name if passed
  if (options.knowledgePointName) {
      uni.setNavigationBarTitle({ title: options.knowledgePointName })
  }
  fetchQuestions(true)
})

onReachBottom(() => {
  if (hasMore.value) {
    fetchQuestions()
  }
})

const fetchQuestions = async (isRefresh = false) => {
  if (isRefresh) {
    queryParams.value.page = 1
    questions.value = []
    hasMore.value = true
  }

  loading.value = true
  status.value = 'loading'

  try {
    const res = await getQuestions(queryParams.value)
    if (res.success) {
      questions.value = [...questions.value, ...res.data.items]
      if (res.data.items.length < queryParams.value.limit) {
        hasMore.value = false
        status.value = 'noMore'
      } else {
        queryParams.value.page++
      }
    }
  } catch (error) {
    console.error('Failed to fetch questions:', error)
    status.value = 'noMore'
  } finally {
    loading.value = false
  }
}

const navigateToDetail = (questionId) => {
  uni.navigateTo({
    url: `/pages/question/detail?id=${questionId}`
  })
}

</script>

<style scoped>
.question-list-container {
  padding: 10px;
}
.loading-container, .empty-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
}
</style>
