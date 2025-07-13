<template>
  <div class="app-container">
    <el-form
      ref="articleFormRef"
      :model="articleForm"
      :rules="rules"
      label-width="100px"
    >
      <el-card header="创建新文章">
        <el-form-item label="文章标题" prop="title">
          <el-input
            v-model="articleForm.title"
            placeholder="请输入文章标题"
          />
        </el-form-item>

        <el-form-item label="文章分类" prop="category_id">
          <el-select
            v-model="articleForm.category_id"
            placeholder="请选择分类"
            style="width: 100%"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="文章内容" prop="content">
          <el-input
            v-model="articleForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入文章内容"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-tag
            v-for="tag in articleForm.tags"
            :key="tag"
            closable
            :disable-transitions="false"
            @close="handleCloseTag(tag)"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="tagInputVisible"
            ref="tagInputRef"
            v-model="tagInputValue"
            class="ml-1 w-20"
            size="small"
            @keyup.enter="handleTagInputConfirm"
            @blur="handleTagInputConfirm"
          />
          <el-button v-else class="button-new-tag ml-1" size="small" @click="showTagInput">
            + 添加新标签
          </el-button>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="articleForm.status">
            <el-radio label="draft">草稿</el-radio>
            <el-radio label="published">发布</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submitForm(articleFormRef)">
            立即创建
          </el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-card>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { createArticle, fetchArticleCategories } from '@/api/content'

const router = useRouter()
const articleFormRef = ref(null)
const loading = ref(false)

const articleForm = reactive({
  title: '',
  content: '',
  category_id: '',
  status: 'draft',
  tags: []
})

const categoryOptions = ref([])

const rules = reactive({
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择文章分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }]
})

const getCategories = async () => {
  try {
    const response = await fetchArticleCategories()
    // 假设API返回的数据结构是 { data: { categories: [...] } }
    // 如果不是，需要根据实际情况调整
    categoryOptions.value = response.data.categories || []
  } catch (error) {
    console.error('获取文章分类失败:', error)
    ElNotification({
      title: '错误',
      message: '获取文章分类失败，请稍后重试',
      type: 'error'
    })
  }
}

const submitForm = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await createArticle(articleForm)
        ElNotification({
          title: '成功',
          message: '文章创建成功',
          type: 'success',
          duration: 2000
        })
        router.push({ name: 'Articles' }) // 假设文章列表页的路由名称是 'ArticleList'
      } catch (error) {
        console.error('文章创建失败:', error)
        // 可以在这里处理更详细的错误信息展示
      } finally {
        loading.value = false
      }
    }
  })
}

const goBack = () => {
  router.back()
}

// --- 标签处理逻辑 ---
const tagInputValue = ref('')
const tagInputVisible = ref(false)
const tagInputRef = ref(null)

const handleCloseTag = (tag) => {
  articleForm.tags.splice(articleForm.tags.indexOf(tag), 1)
}

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.input.focus()
  })
}

const handleTagInputConfirm = () => {
  if (tagInputValue.value) {
    articleForm.tags.push(tagInputValue.value)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}
// --- 标签处理逻辑结束 ---

onMounted(() => {
  getCategories()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.el-card {
  max-width: 800px;
  margin: 0 auto;
}
.el-tag + .el-tag {
  margin-left: 10px;
}
.button-new-tag {
  margin-left: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}
.input-new-tag {
  width: 90px;
  margin-left: 10px;
  vertical-align: bottom;
}
.ml-1 {
  margin-left: 10px;
}
.w-20 {
  width: 90px;
}
</style>