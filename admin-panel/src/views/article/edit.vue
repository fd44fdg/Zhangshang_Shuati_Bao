
<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑文章' : '撰写新文章' }}</span>
      </template>
      <el-form ref="articleFormRef" :model="article" :rules="rules" label-width="120px">
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="article.title" />
        </el-form-item>
        <el-form-item label="文章分类" prop="category_id">
          <el-select v-model="article.category_id" placeholder="请选择分类">
            <el-option v-for="category in categoryOptions" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="article.status">
            <el-radio label="published">发布</el-radio>
            <el-radio label="draft">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <!-- Placeholder for a rich text editor -->
          <el-input v-model="article.content" type="textarea" :rows="15" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm">保存</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getArticle, createArticle, updateArticle, getArticleCategories } from '@/api/article'
import { ElNotification } from 'element-plus'

const route = useRoute()
const router = useRouter()

const article = ref({
  id: null,
  title: '',
  content: '',
  category_id: null,
  status: 'draft'
})
const categoryOptions = ref([])
const articleFormRef = ref(null)

const isEdit = computed(() => !!route.params.id && route.params.id !== 'new')

const rules = {
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择文章分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }]
}

const fetchCategories = async () => {
  const response = await getArticleCategories()
  categoryOptions.value = response.data
}

const fetchArticle = async (id) => {
  const response = await getArticle(id)
  article.value = response.data
}

const submitForm = () => {
  articleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateArticle(article.value.id, article.value)
          ElNotification({ title: '成功', message: '文章更新成功', type: 'success' })
        } else {
          await createArticle(article.value)
          ElNotification({ title: '成功', message: '文章创建成功', type: 'success' })
        }
        router.push({ name: 'ArticleList' })
      } catch (error) {
        console.error('Failed to save article:', error)
      }
    }
  })
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchCategories()
  if (isEdit.value) {
    fetchArticle(route.params.id)
  }
})
</script>

<style scoped>
.app-container { padding: 20px; }
</style>
