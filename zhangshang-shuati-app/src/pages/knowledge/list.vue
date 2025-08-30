
<template>
  <view class="points-container">
    <uni-list>
      <uni-list-item
        v-for="point in points"
        :key="point.id"
        :title="point.name"
        :note="point.description"
        show-arrow
        clickable
        @click="navigateToQuestions(point.id)"
      />
    </uni-list>
    <view v-if="loading" class="loading-container">
      <uni-load-more :status="status"></uni-load-more>
    </view>
    <view v-if="!loading && points.length === 0" class="empty-container">
      <text>该分类下暂无知识点</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import { getKnowledgePoints } from '@/api/knowledge'

const points = ref([])
const categoryId = ref(null)
const categoryName = ref('')
const loading = ref(true)
const status = ref('loading')

const queryParams = ref({
  page: 1,
  limit: 20,
  category_id: null
})

const hasMore = ref(true)

onLoad((options) => {
  categoryId.value = options.categoryId
  categoryName.value = options.categoryName
  queryParams.value.category_id = options.categoryId
  uni.setNavigationBarTitle({ title: options.categoryName })
  fetchPoints(true)
})

onReachBottom(() => {
  if (hasMore.value) {
    fetchPoints()
  }
})

const fetchPoints = async (isRefresh = false) => {
  if (isRefresh) {
    queryParams.value.page = 1
    points.value = []
    hasMore.value = true
  }

  loading.value = true
  status.value = 'loading'

  try {
    const res = await getKnowledgePoints(queryParams.value)
    if (res.success) {
      points.value = [...points.value, ...res.data.items]
      if (res.data.items.length < queryParams.value.limit) {
        hasMore.value = false
        status.value = 'noMore'
      } else {
        queryParams.value.page++
      }
    }
  } catch (error) {
    console.error('Failed to fetch knowledge points:', error)
    status.value = 'noMore' // Stop trying on error
  } finally {
    loading.value = false
  }
}

const navigateToQuestions = (pointId) => {
  // This is the next step. For now, we just log it.
  console.log(`Navigate to questions for knowledge point ID: ${pointId}`)
  uni.navigateTo({
    // TODO: This URL needs to be created. It will show a list of questions for the given knowledge point.
    url: `/pages/question/list?knowledgePointId=${pointId}`
  })
}

</script>

<style scoped>
.points-container {
  padding: 10px;
}
.loading-container, .empty-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
