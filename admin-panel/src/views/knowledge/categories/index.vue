<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>知识点分类管理</span>
          <el-button type="primary" :icon="Plus" @click="handleCreate">
            新增分类
          </el-button>
        </div>
      </template>

      <div class="filter-container">
        <el-input
          v-model="listQuery.name"
          placeholder="分类名称"
          style="width: 200px;"
          class="filter-item"
          @keyup.enter="handleFilter"
        />
        <el-select v-model="listQuery.status" placeholder="状态" clearable class="filter-item" style="width: 130px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button class="filter-item" type="primary" :icon="Search" @click="handleFilter">
          搜索
        </el-button>
         <el-button class="filter-item" @click="resetFilter">
          重置
        </el-button>
      </div>

      <el-table
        v-loading="listLoading"
        :data="list"
        border
        fit
        highlight-current-row
        style="width: 100%;"
      >
        <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80" />
        <el-table-column label="分类名称" prop="name" />
        <el-table-column label="描述" prop="description" show-overflow-tooltip />
        <el-table-column label="排序" prop="sort" align="center" width="90" />
        <el-table-column label="状态" class-name="status-col" width="100">
          <template #default="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
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

      <pagination
        v-show="total>0"
        :total="total"
        v-model:page="listQuery.page"
        v-model:limit="listQuery.limit"
        @pagination="getList"
      />
    </el-card>

    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible">
      <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="temp.description" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="temp.sort" :min="0" controls-position="right" />
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
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElNotification, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { fetchKnowledgeCategories, createKnowledgeCategory, updateKnowledgeCategory, deleteKnowledgeCategory } from '@/api/knowledge'
import Pagination from '@/components/Pagination/index.vue'

const list = ref([])
const total = ref(0)
const listLoading = ref(true)
const listQuery = reactive({
  page: 1,
  limit: 20,
  name: undefined,
  status: undefined
})

const temp = ref({
  id: undefined,
  name: '',
  description: '',
  sort: 0,
  status: 1
})

const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = {
  update: '编辑分类',
  create: '创建分类'
}

const dataFormRef = ref(null)
const rules = {
  name: [{ required: true, message: '分类名称必须填写', trigger: 'blur' }],
  status: [{ required: true, message: '状态必须选择', trigger: 'change' }]
}

const getList = async () => {
  listLoading.value = true
  try {
    const { data } = await fetchKnowledgeCategories(listQuery)
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

const resetFilter = () => {
    listQuery.page = 1
    listQuery.name = undefined
    listQuery.status = undefined
    getList()
}

const resetTemp = () => {
  temp.value = {
    id: undefined,
    name: '',
    description: '',
    sort: 0,
    status: 1
  }
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
      const tempData = { ...temp.value }
      await createKnowledgeCategory(tempData)
      dialogFormVisible.value = false
      ElNotification({
        title: '成功',
        message: '分类创建成功',
        type: 'success',
        duration: 2000
      })
      getList()
    }
  })
}

const handleUpdate = (row) => {
  temp.value = { ...row } // copy obj
  dialogStatus.value = 'update'
  dialogFormVisible.value = true
  dataFormRef.value?.resetFields()
}

const updateData = () => {
  dataFormRef.value?.validate(async (valid) => {
    if (valid) {
      const tempData = { ...temp.value }
      await updateKnowledgeCategory(tempData.id, tempData)
      dialogFormVisible.value = false
      ElNotification({
        title: '成功',
        message: '分类更新成功',
        type: 'success',
        duration: 2000
      })
      getList()
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除分类 "${row.name}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteKnowledgeCategory(row.id)
    ElNotification({
      title: '成功',
      message: '删除成功',
      type: 'success',
      duration: 2000
    })
    getList()
  }).catch(() => {
    // catch error
  });
}


onMounted(() => {
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
.filter-container {
  padding-bottom: 10px;
}
.filter-item {
  margin-right: 10px;
}
</style>