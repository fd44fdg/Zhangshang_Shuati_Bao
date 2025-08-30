
<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文章分类管理</span>
          <el-button type="primary" :icon="Plus" @click="handleCreate">
            新增分类
          </el-button>
        </div>
      </template>

      <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%;">
        <el-table-column label="ID" prop="id" align="center" width="80" />
        <el-table-column label="分类名称" prop="name" />
        <el-table-column label="描述" prop="description" show-overflow-tooltip />
        <el-table-column label="排序" prop="sort_order" align="center" width="90" />
        <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
          <template #default="{row}">
            <el-button type="primary" size="small" @click="handleUpdate(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" :close-on-click-modal="false">
      <el-form ref="dataFormRef" :rules="rules" :model="temp" label-position="left" label-width="100px" style="width: 400px; margin-left:50px;">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="temp.description" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="temp.sort_order" :min="0" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElNotification, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getArticleCategories, createArticleCategory, updateArticleCategory, deleteArticleCategory } from '@/api/article'

const list = ref([])
const listLoading = ref(true)

const temp = ref({ id: undefined, name: '', description: '', sort_order: 0 })

const dialogFormVisible = ref(false)
const dialogStatus = ref('')
const textMap = { update: '编辑分类', create: '创建分类' }

const dataFormRef = ref(null)
const rules = { name: [{ required: true, message: '分类名称必须填写', trigger: 'blur' }] }

const getList = async () => {
  listLoading.value = true
  try {
    const response = await getArticleCategories()
    list.value = response.data
  } finally {
    listLoading.value = false
  }
}

const resetTemp = () => { temp.value = { id: undefined, name: '', description: '', sort_order: 0 } }

const handleCreate = () => {
  resetTemp()
  dialogStatus.value = 'create'
  dialogFormVisible.value = true
  dataFormRef.value?.resetFields()
}

const createData = () => {
  dataFormRef.value?.validate(async (valid) => {
    if (valid) {
      await createArticleCategory(temp.value)
      dialogFormVisible.value = false
      ElNotification({ title: '成功', message: '分类创建成功', type: 'success', duration: 2000 })
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
      await updateArticleCategory(temp.value.id, temp.value)
      dialogFormVisible.value = false
      ElNotification({ title: '成功', message: '分类更新成功', type: 'success', duration: 2000 })
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
    await deleteArticleCategory(row.id)
    ElNotification({ title: '成功', message: '删除成功', type: 'success', duration: 2000 })
    getList()
  }).catch(() => {})
}

onMounted(() => { getList() })
</script>

<style scoped>
.app-container { padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
