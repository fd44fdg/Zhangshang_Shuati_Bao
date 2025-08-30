
<template>
  <view class="knowledge-container">
    <uni-list>
      <uni-list-item
        v-for="category in categories"
        :key="category.id"
        :title="category.name"
        :note="`共 ${category.points_count} 个知识点`"
        show-arrow
        clickable
        @click="navigateToPoints(category.id, category.name)"
      />
    </uni-list>
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading"></uni-load-more>
    </view>
    <view v-if="!loading && categories.length === 0" class="empty-container">
      <text>暂无知识点分类</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getKnowledgePointCategories } from '@/api/knowledge'

const categories = ref([])
const loading = ref(true)

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await getKnowledgePointCategories()
    if (res.success) {
      categories.value = res.data
    }
  } catch (error) {
    console.error('Failed to fetch knowledge categories:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const navigateToPoints = (categoryId, categoryName) => {
  uni.navigateTo({
    url: `/pages/knowledge/list?categoryId=${categoryId}&categoryName=${categoryName}`
  })
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.knowledge-container {
  padding: 10px;
}
.loading-container, .empty-container {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
