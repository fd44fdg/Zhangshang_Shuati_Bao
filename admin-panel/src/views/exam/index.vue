
<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考试管理</span>
          <el-button type="primary" :icon="Plus" @click="handleCreate">
            新增考试
          </el-button>
        </div>
      </template>

      <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%;">
        <el-table-column label="ID" prop="id" align="center" width="80" />
        <el-table-column label="考试名称" prop="title" />
        <el-table-column label="所属分类" prop="category_name" width="150px" align="center" />
        <el-table-column label="题目数" prop="question_count" align="center" width="100" />
        <el-table-column label="时长(分钟)" prop="duration" align="center" width="120" />
        <el-table-column label="描述" prop="description" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
          <template #default="{row}">
            <el-button type="primary" size="small" @click="handleUpdate(row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="600px" :close-on-click-modal="false">
      <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 90%; margin: 0 auto;">
        <el-form-item label="考试名称" prop="title">
          <el-input v-model="temp.title" />
        </el-form-item>
        <el-form-item label="所属分类" prop="category_id">
          <el-select v-model="temp.category_id" placeholder="用于出题范围" style="width: 100%">
            <el-option v-for="category in categoryOptions" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="题目数量" prop="question_count">
          <el-input-number v-model="temp.question_count" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="时长(分钟)" prop="duration">
          <el-input-number v-model="temp.duration" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="temp.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create' ? createData() : updateData()">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElNotification, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getExams, createExam, updateExam, deleteExam } from '@/api/exam'
import { getQuestionCategories } from '@/api/question' // Re-use this API

const list = ref([])
const listLoading = ref(true)
const categoryOptions = ref([])

const temp = ref({
  id: undefined,
  title: '',
  description: '',
  duration: 60,
  question_count: 20,
  category_id: null
})

const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = {
  update: '编辑考试',
  create: '新增考试'
}
const dataFormRef = ref(null)
const rules = {
  title: [{ required: true, message: '名称必须填写', trigger: 'blur' }],
  category_id: [{ required: true, message: '分类必须选择', trigger: 'change' }],
  duration: [{ required: true, message: '时长必须填写', trigger: 'blur' }],
  question_count: [{ required: true, message: '题目数必须填写', trigger: 'blur' }]
}

const fetchCategories = async () => {
  const response = await getQuestionCategories()
  categoryOptions.value = response.data.items
}

const getList = async () => {
  listLoading.value = true
  try {
    const response = await getExams()
    list.value = response.data
  } finally {
    listLoading.value = false
  }
}

const resetTemp = () => {
  temp.value = { id: undefined, title: '', description: '', duration: 60, question_count: 20, category_id: null }
}

const handleCreate = () => {
  resetTemp()
  dialogStatus.value = 'create'
  dialogFormVisible.value = true
  dataFormRef.value?.resetFields()
}

const createData = () => {
  dataFormRef.value?.validate(async (valid) => {
    if (valid) {
      await createExam(temp.value)
      dialogFormVisible.value = false
      ElNotification({ title: '成功', message: '创建成功', type: 'success', duration: 2000 })
      getList()
    }
  })
}

const handleUpdate = (row) => {
  temp.value = { ...row }
  dialogStatus.value = 'update'
  dialogFormVisible.value = true
  dataFormRef.value?.resetFields()
}

const updateData = () => {
  dataFormRef.value?.validate(async (valid) => {
    if (valid) {
      await updateExam(temp.value.id, temp.value)
      dialogFormVisible.value = false
      ElNotification({ title: '成功', message: '更新成功', type: 'success', duration: 2000 })
      getList()
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除考试 "${row.title}"?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteExam(row.id)
    ElNotification({ title: '成功', message: '删除成功', type: 'success', duration: 2000 })
    getList()
  }).catch(() => {})
}

onMounted(() => {
  fetchCategories()
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
