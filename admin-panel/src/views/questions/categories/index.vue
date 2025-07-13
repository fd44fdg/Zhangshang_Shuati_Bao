<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.keyword" placeholder="分类名称" style="width: 200px;" class="filter-item" @keyup.enter="handleFilter" />
      <el-button v-waves class="filter-item" type="primary" icon="Search" @click="handleFilter">
        搜索
      </el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="Plus" @click="handleCreate">
        添加分类
      </el-button>
    </div>

    <el-table :key="tableKey" v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%;">
      <el-table-column label="ID" prop="id" align="center" width="80" />
      <el-table-column label="分类名称" min-width="200px">
        <template #default="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="描述" min-width="300px">
        <template #default="{row}">
          <span>{{ row.description || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="题目数" prop="questionCount" align="center" width="100" />
      <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
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

    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible">
      <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="temp.description" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { fetchQuestionCategories, createQuestionCategory, updateQuestionCategory, deleteQuestionCategory } from '@/api/question'
import waves from '@/directive/waves'
import Pagination from '@/components/Pagination/index.vue'
import { ElNotification, ElMessageBox } from 'element-plus'

const tableKey = ref(0)
const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
  page: 1,
  limit: 10,
  keyword: undefined
})

const temp = ref({
  id: undefined,
  name: '',
  description: ''
})

const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = {
  update: '编辑分类',
  create: '创建分类'
}

const dataFormRef = ref(null)
const rules = {
  name: [{ required: true, message: '分类名称为必填项', trigger: 'blur' }]
}

const getList = async () => {
  listLoading.value = true
  try {
    const response = await fetchQuestionCategories(listQuery)
    const allItems = response.data.items

    const filteredItems = listQuery.keyword
      ? allItems.filter(item => item.name.toLowerCase().includes(listQuery.keyword.toLowerCase()))
      : allItems

    total.value = filteredItems.length
    const startIndex = (listQuery.page - 1) * listQuery.limit
    list.value = filteredItems.slice(startIndex, startIndex + listQuery.limit)

  } catch (error) {
    ElNotification({ title: '错误', message: '获取题目分类列表失败', type: 'error' })
  } finally {
    listLoading.value = false
  }
}

onMounted(getList)

const handleFilter = () => {
  listQuery.page = 1
  getList()
}

const resetTemp = () => {
  temp.value = {
    id: undefined,
    name: '',
    description: ''
  }
}

const handleCreate = () => {
  resetTemp()
  dialogStatus.value = 'create'
  dialogFormVisible.value = true
  dataFormRef.value?.clearValidate()
}

const createData = () => {
  dataFormRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        await createQuestionCategory(temp.value)
        dialogFormVisible.value = false
        ElNotification({
          title: '成功',
          message: '分类创建成功',
          type: 'success',
          duration: 2000
        })
        getList()
      } catch (error) {
        ElNotification({ title: '错误', message: error.message || '创建失败', type: 'error' })
      }
    }
  })
}

const handleUpdate = (row) => {
  temp.value = Object.assign({}, row)
  dialogStatus.value = 'update'
  dialogFormVisible.value = true
  dataFormRef.value?.clearValidate()
}

const updateData = () => {
  dataFormRef.value?.validate(async (valid) => {
    if (valid) {
      const tempData = Object.assign({}, temp.value)
      try {
        await updateQuestionCategory(tempData.id, tempData)
        dialogFormVisible.value = false
        ElNotification({
          title: '成功',
          message: '更新成功',
          type: 'success',
          duration: 2000
        })
        getList()
      } catch (error) {
        ElNotification({ title: '错误', message: error.message || '更新失败', type: 'error' })
      }
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除分类 "${row.name}"?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async() => {
    try {
      await deleteQuestionCategory(row.id)
      ElNotification({
        title: '成功',
        message: '删除成功',
        type: 'success',
        duration: 2000
      })
      getList()
    } catch (error) {
      ElNotification({ title: '错误', message: error.message || '删除失败', type: 'error' })
    }
  })
}
</script>

<style scoped>
.filter-container {
  padding-bottom: 20px;
}
.dialog-footer {
  padding-top: 20px;
  text-align: right;
}
.link-type {
  color: #337ab7;
  cursor: pointer;
}
.link-type:hover {
  color: #23527c;
}
</style>