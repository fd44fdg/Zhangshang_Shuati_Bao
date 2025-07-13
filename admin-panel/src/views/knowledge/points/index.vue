<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <span>知识点管理</span>
      </template>
      <div class="filter-container">
        <el-input v-model="listQuery.keyword" placeholder="知识点名称" style="width: 200px;" class="filter-item" @keyup.enter="handleFilter" />
        <el-select v-model="listQuery.category_id" placeholder="选择分类" clearable class="filter-item" style="width: 150px">
          <el-option v-for="category in categoryOptions" :key="category.id" :label="category.name" :value="category.id" />
        </el-select>
        <el-select v-model="listQuery.difficulty" placeholder="难度" clearable class="filter-item" style="width: 120px">
          <el-option label="简单" value="easy" />
          <el-option label="中等" value="medium" />
          <el-option label="困难" value="hard" />
        </el-select>
        <el-button class="filter-item" type="primary" :icon="Search" @click="handleFilter">
          搜索
        </el-button>
        <el-button class="filter-item" style="margin-left: 10px;" type="primary" :icon="Plus" @click="handleCreate">
          添加知识点
        </el-button>
      </div>

      <el-table :data="list" v-loading="listLoading" border fit highlight-current-row style="width: 100%;">
        <el-table-column label="ID" prop="id" align="center" width="80" />
        <el-table-column label="知识点名称" prop="name" />
        <el-table-column label="分类" prop="category_name" width="120px" align="center" />
        <el-table-column label="难度" width="110px" align="center">
          <template #default="{row}">
            <el-tag :type="difficultyTypeMap[row.difficulty]">{{ difficultyLabelMap[row.difficulty] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="描述" prop="description" show-overflow-tooltip />
        <el-table-column label="状态" class-name="status-col" width="100">
          <template #default="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
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

      <pagination v-show="total>0" :total="total" v-model:page="listQuery.page" v-model:limit="listQuery.limit" @pagination="getList" />
    </el-card>

    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="600px">
      <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 90%; margin: 0 auto;">
        <el-form-item label="知识点名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="分类" prop="category_id">
          <el-select v-model="temp.category_id" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="category in categoryOptions" :key="category.id" :label="category.name" :value="category.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="temp.difficulty" placeholder="请选择难度" style="width: 100%">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="temp.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="temp.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
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
import { ref, reactive, onMounted } from 'vue'
import { ElNotification, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { fetchKnowledgePoints, createKnowledgePoint, updateKnowledgePoint, deleteKnowledgePoint, fetchKnowledgeCategories } from '@/api/knowledge'
import Pagination from '@/components/Pagination/index.vue'

const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
  page: 1,
  limit: 20,
  keyword: undefined,
  category_id: undefined,
  difficulty: undefined
})

const categoryOptions = ref([])

const temp = ref({
  id: undefined,
  name: '',
  category_id: '',
  difficulty: '',
  description: '',
  status: 1
})

const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = {
  update: '编辑知识点',
  create: '创建知识点'
}
const dataFormRef = ref(null)
const rules = {
  name: [{ required: true, message: '名称必须填写', trigger: 'blur' }],
  category_id: [{ required: true, message: '分类必须选择', trigger: 'change' }],
  difficulty: [{ required: true, message: '难度必须选择', trigger: 'change' }]
}

const difficultyLabelMap = { easy: '简单', medium: '中等', hard: '困难' }
const difficultyTypeMap = { easy: 'success', medium: 'warning', hard: 'danger' }

const getCategories = async () => {
  const { data } = await fetchKnowledgeCategories({ page: 1, limit: 1000 }) // 获取全部分类
  categoryOptions.value = data.items
}

const getList = async () => {
  listLoading.value = true
  try {
    const { data } = await fetchKnowledgePoints(listQuery)
    list.value = data.items
    total.value = data.total
  } finally {
    listLoading.value = false
  }
}

const handleFilter = () => {
  listQuery.page = 1
  getList()
}

const resetTemp = () => {
  temp.value = { id: undefined, name: '', category_id: '', difficulty: '', description: '', status: 1 }
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
      await createKnowledgePoint(temp.value)
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
      await updateKnowledgePoint(temp.value.id, temp.value)
      dialogFormVisible.value = false
      ElNotification({ title: '成功', message: '更新成功', type: 'success', duration: 2000 })
      getList()
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除知识点 "${row.name}"?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteKnowledgePoint(row.id)
    ElNotification({ title: '成功', message: '删除成功', type: 'success', duration: 2000 })
    getList()
  }).catch(() => {})
}

onMounted(() => {
  getCategories()
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.filter-container {
  padding-bottom: 10px;
}
.filter-item {
  margin-right: 10px;
  margin-bottom: 10px;
}
</style>