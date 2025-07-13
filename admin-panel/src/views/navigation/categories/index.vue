<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="搜索分类名称"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleFilter"
      />
      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="Search"
        @click="handleFilter"
      >
        搜索
      </el-button>
      <el-button
        class="filter-item"
        style="margin-left: 10px;"
        type="primary"
        icon="Plus"
        @click="handleCreate"
      >
        添加分类
      </el-button>
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
    >
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80">
        <template #default="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="分类名称" width="150px" align="center">
        <template #default="{row}">
          <span>{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="分类图标" width="100px" align="center">
        <template #default="{row}">
          <el-icon v-if="row.icon" size="20">
            <component :is="row.icon" />
          </el-icon>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="排序" width="80px" align="center">
        <template #default="{row}">
          <span>{{ row.sort_order }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" class-name="status-col" width="100">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="150px" align="center">
        <template #default="{row}">
          <span>{{ formatDate(row.created_at) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
        <template #default="{row, $index}">
          <el-button type="primary" size="small" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button
            v-if="row.status === 1"
            size="small"
            type="warning"
            @click="handleModifyStatus(row, 0)"
          >
            禁用
          </el-button>
          <el-button
            v-else
            size="small"
            type="success"
            @click="handleModifyStatus(row, 1)"
          >
            启用
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row, $index)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="listQuery.page"
        v-model:limit="listQuery.limit"
        @pagination="getList"
      />

    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible">
      <el-form
        ref="dataFormRef"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="100px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="temp.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类图标" prop="icon">
          <el-select v-model="temp.icon" placeholder="请选择图标">
            <el-option label="文档" value="Document" />
            <el-option label="文件夹" value="Folder" />
            <el-option label="标签" value="Collection" />
            <el-option label="设置" value="Setting" />
            <el-option label="用户" value="User" />
            <el-option label="首页" value="House" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="temp.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="temp.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Pagination from '@/components/Pagination/index.vue'
import waves from '@/directive/waves'

export default {
  name: 'NavigationCategories',
  components: { Pagination },
  directives: { waves },
  setup() {
    const tableKey = ref(0)
    const list = ref([])
    const total = ref(0)
    const listLoading = ref(true)
    const dialogFormVisible = ref(false)
    const dialogStatus = ref('')
    const dataFormRef = ref(null)
    
    const listQuery = reactive({
      page: 1,
      limit: 20,
      keyword: ''
    })
    
    const temp = reactive({
      id: undefined,
      name: '',
      icon: '',
      sort_order: 0,
      status: 1
    })
    
    const textMap = {
      update: '编辑分类',
      create: '创建分类'
    }
    
    const rules = {
      name: [{ required: true, message: '分类名称是必填项', trigger: 'blur' }],
      sort_order: [{ required: true, message: '排序是必填项', trigger: 'blur' }]
    }
    
    // 模拟数据
    const mockData = [
      {
        id: 1,
        name: '前端开发',
        icon: 'Document',
        sort_order: 1,
        status: 1,
        created_at: '2024-01-15 10:30:00'
      },
      {
        id: 2,
        name: '后端开发',
        icon: 'Folder',
        sort_order: 2,
        status: 1,
        created_at: '2024-01-15 09:15:00'
      },
      {
        id: 3,
        name: '数据库',
        icon: 'Collection',
        sort_order: 3,
        status: 0,
        created_at: '2024-01-14 16:20:00'
      }
    ]
    
    const getList = () => {
      listLoading.value = true
      // 模拟API调用
      setTimeout(() => {
        let filteredData = mockData
        if (listQuery.keyword) {
          filteredData = mockData.filter(item => 
            item.name.toLowerCase().includes(listQuery.keyword.toLowerCase())
          )
        }
        list.value = filteredData
        total.value = filteredData.length
        listLoading.value = false
      }, 500)
    }
    
    const handleFilter = () => {
      listQuery.page = 1
      getList()
    }
    
    const resetTemp = () => {
      temp.id = undefined
      temp.name = ''
      temp.icon = ''
      temp.sort_order = 0
      temp.status = 1
    }
    
    const handleCreate = () => {
      resetTemp()
      dialogStatus.value = 'create'
      dialogFormVisible.value = true
    }
    
    const createData = () => {
      dataFormRef.value.validate((valid) => {
        if (valid) {
          const newItem = {
            ...temp,
            id: Date.now(),
            created_at: new Date().toLocaleString()
          }
          mockData.unshift(newItem)
          list.value.unshift(newItem)
          dialogFormVisible.value = false
          ElMessage({
            message: '创建成功',
            type: 'success'
          })
        }
      })
    }
    
    const handleUpdate = (row) => {
      Object.assign(temp, row)
      dialogStatus.value = 'update'
      dialogFormVisible.value = true
    }
    
    const updateData = () => {
      dataFormRef.value.validate((valid) => {
        if (valid) {
          const index = list.value.findIndex(v => v.id === temp.id)
          list.value.splice(index, 1, { ...temp })
          dialogFormVisible.value = false
          ElMessage({
            message: '更新成功',
            type: 'success'
          })
        }
      })
    }
    
    const handleDelete = (row, index) => {
      ElMessageBox.confirm('此操作将永久删除该分类, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        list.value.splice(index, 1)
        ElMessage({
          type: 'success',
          message: '删除成功!'
        })
      })
    }
    
    const handleModifyStatus = (row, status) => {
      row.status = status
      ElMessage({
        message: '状态修改成功',
        type: 'success'
      })
    }
    
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString()
    }
    
    onMounted(() => {
      getList()
    })
    
    return {
      tableKey,
      list,
      total,
      listLoading,
      listQuery,
      dialogFormVisible,
      dialogStatus,
      dataFormRef,
      temp,
      textMap,
      rules,
      getList,
      handleFilter,
      handleCreate,
      createData,
      handleUpdate,
      updateData,
      handleDelete,
      handleModifyStatus,
      formatDate
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.filter-container {
  padding-bottom: 10px;
}

.filter-item {
  display: inline-block;
  vertical-align: middle;
  margin-bottom: 10px;
}
</style>