<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.name"
        placeholder="分类名称"
        style="width: 200px"
        class="filter-item"
        @keyup.enter="handleFilter"
      />
      <el-select
        v-model="listQuery.status"
        placeholder="状态"
        clearable
        style="width: 120px"
        class="filter-item"
      >
        <el-option label="启用" value="1" />
        <el-option label="禁用" value="0" />
      </el-select>
      <el-select
        v-model="listQuery.parent_id"
        placeholder="父级分类"
        clearable
        style="width: 150px"
        class="filter-item"
      >
        <el-option label="顶级分类" :value="0" />
        <el-option
          v-for="item in parentCategories"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="handleFilter"
      >
        搜索
      </el-button>
      <el-button
        class="filter-item"
        style="margin-left: 10px"
        type="primary"
        icon="el-icon-edit"
        @click="handleCreate"
      >
        添加分类
      </el-button>
      <el-button
        v-waves
        :loading="downloadLoading"
        class="filter-item"
        type="primary"
        icon="el-icon-download"
        @click="handleDownload"
      >
        导出
      </el-button>
    </div>

    <!-- 表格 -->
    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      @sort-change="sortChange"
    >
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80" />
      <el-table-column label="分类名称" min-width="200px">
        <template #default="{row}">
          <span class="category-name">
            <i v-if="row.icon" :class="row.icon" class="category-icon"></i>
            {{ row.name }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="别名" prop="slug" width="150px" align="center" />
      <el-table-column label="描述" prop="description" min-width="200px" show-overflow-tooltip />
      <el-table-column label="文章数" width="100px" align="center">
        <template #default="{row}">
          <el-tag type="info" size="small">{{ row.article_count }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort_order" width="80px" align="center" />
      <el-table-column label="状态" class-name="status-col" width="100">
        <template #default="{row}">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleModifyStatus(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="150px" align="center">
        <template #default="{row}">
          <span>{{ row.created_at }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
        <template #default="{row, $index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button
            size="mini"
            type="success"
            @click="handleAddChild(row)"
          >
            添加子分类
          </el-button>
          <el-button
            size="mini"
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
      :page.sync="listQuery.page"
      :limit.sync="listQuery.limit"
      @pagination="getList"
    />

    <!-- 分类表单对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogFormVisible" width="600px">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="100px"
        style="width: 100%"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="temp.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类别名" prop="slug">
          <el-input v-model="temp.slug" placeholder="请输入分类别名（英文）" />
          <div class="form-tip">用于URL，建议使用英文字母和连字符</div>
        </el-form-item>
        <el-form-item label="父级分类" prop="parent_id">
          <el-select v-model="temp.parent_id" placeholder="请选择父级分类" style="width: 100%">
            <el-option label="顶级分类" :value="0" />
            <el-option
              v-for="item in parentCategories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
              :disabled="item.id === temp.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类图标">
          <el-input v-model="temp.icon" placeholder="请输入图标类名">
            <template #prepend>
              <i v-if="temp.icon" :class="temp.icon"></i>
              <span v-else>图标</span>
            </template>
          </el-input>
          <div class="form-tip">例如：el-icon-folder、fa fa-folder 等</div>
        </el-form-item>
        <el-form-item label="分类描述">
          <el-input
            v-model="temp.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        <el-form-item label="SEO关键词">
          <el-input v-model="temp.seo_keywords" placeholder="请输入SEO关键词" />
        </el-form-item>
        <el-form-item label="SEO描述">
          <el-input
            v-model="temp.seo_description"
            type="textarea"
            :rows="2"
            placeholder="请输入SEO描述"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序" prop="sort_order">
              <el-input-number
                v-model="temp.sort_order"
                :min="0"
                :max="9999"
                placeholder="数值越大越靠前"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="temp.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Pagination from '@/components/Pagination/index.vue'
import waves from '@/directive/waves'

export default {
  name: 'ArticleCategories',
  components: { Pagination },
  directives: { waves },
  setup() {
    const tableKey = ref(0)
    const list = ref([])
    const total = ref(0)
    const listLoading = ref(true)
    const downloadLoading = ref(false)
    const dialogFormVisible = ref(false)
    const dialogStatus = ref('')
    const dialogTitle = ref('')
    
    const listQuery = reactive({
      page: 1,
      limit: 20,
      name: undefined,
      status: undefined,
      parent_id: undefined,
      sort: '+id'
    })
    
    const temp = reactive({
      id: undefined,
      name: '',
      slug: '',
      parent_id: 0,
      icon: '',
      description: '',
      seo_keywords: '',
      seo_description: '',
      sort_order: 0,
      status: 1
    })
    
    const parentCategories = ref([])
    
    const rules = {
      name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
      slug: [
        { required: true, message: '分类别名不能为空', trigger: 'blur' },
        { pattern: /^[a-zA-Z0-9-_]+$/, message: '别名只能包含字母、数字、连字符和下划线', trigger: 'blur' }
      ],
      sort_order: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
      status: [{ required: true, message: '请选择状态', trigger: 'change' }]
    }
    
    // 模拟数据
    const mockData = [
      {
        id: 1,
        name: '技术分享',
        slug: 'tech-share',
        parent_id: 0,
        icon: 'el-icon-cpu',
        description: '技术相关的文章分享',
        seo_keywords: '技术,分享,编程',
        seo_description: '技术分享相关文章',
        sort_order: 100,
        status: 1,
        article_count: 25,
        created_at: '2024-01-10 10:00:00',
        children: [
          {
            id: 11,
            name: '前端开发',
            slug: 'frontend',
            parent_id: 1,
            icon: 'el-icon-monitor',
            description: '前端开发技术',
            seo_keywords: '前端,JavaScript,Vue',
            seo_description: '前端开发技术文章',
            sort_order: 90,
            status: 1,
            article_count: 15,
            created_at: '2024-01-10 11:00:00'
          },
          {
            id: 12,
            name: '后端开发',
            slug: 'backend',
            parent_id: 1,
            icon: 'el-icon-server',
            description: '后端开发技术',
            seo_keywords: '后端,Node.js,Python',
            seo_description: '后端开发技术文章',
            sort_order: 80,
            status: 1,
            article_count: 10,
            created_at: '2024-01-10 12:00:00'
          }
        ]
      },
      {
        id: 2,
        name: '行业动态',
        slug: 'industry-news',
        parent_id: 0,
        icon: 'el-icon-news',
        description: '行业最新动态和资讯',
        seo_keywords: '行业,动态,资讯',
        seo_description: '行业动态资讯文章',
        sort_order: 90,
        status: 1,
        article_count: 18,
        created_at: '2024-01-11 09:00:00'
      },
      {
        id: 3,
        name: '产品介绍',
        slug: 'product-intro',
        parent_id: 0,
        icon: 'el-icon-goods',
        description: '产品功能和特性介绍',
        seo_keywords: '产品,介绍,功能',
        seo_description: '产品介绍相关文章',
        sort_order: 80,
        status: 1,
        article_count: 12,
        created_at: '2024-01-12 14:00:00'
      }
    ]
    
    const getList = () => {
      listLoading.value = true
      // 模拟API调用
      setTimeout(() => {
        list.value = mockData
        total.value = mockData.length
        
        // 提取父级分类
        parentCategories.value = mockData.filter(item => item.parent_id === 0)
        
        listLoading.value = false
      }, 500)
    }
    
    const handleFilter = () => {
      listQuery.page = 1
      getList()
    }
    
    const sortChange = (data) => {
      const { prop, order } = data
      if (prop === 'id') {
        listQuery.sort = order === 'ascending' ? '+id' : '-id'
      }
      handleFilter()
    }
    
    const resetTemp = () => {
      Object.assign(temp, {
        id: undefined,
        name: '',
        slug: '',
        parent_id: 0,
        icon: '',
        description: '',
        seo_keywords: '',
        seo_description: '',
        sort_order: 0,
        status: 1
      })
    }
    
    const handleCreate = () => {
      resetTemp()
      dialogStatus.value = 'create'
      dialogTitle.value = '创建分类'
      dialogFormVisible.value = true
      nextTick(() => {
        // 清除表单验证
      })
    }
    
    const handleAddChild = (row) => {
      resetTemp()
      temp.parent_id = row.id
      dialogStatus.value = 'create'
      dialogTitle.value = `为 "${row.name}" 添加子分类`
      dialogFormVisible.value = true
      nextTick(() => {
        // 清除表单验证
      })
    }
    
    const handleUpdate = (row) => {
      Object.assign(temp, row)
      dialogStatus.value = 'update'
      dialogTitle.value = '编辑分类'
      dialogFormVisible.value = true
      nextTick(() => {
        // 清除表单验证
      })
    }
    
    const createData = () => {
      // 表单验证
      const newCategory = {
        ...temp,
        id: Date.now(),
        article_count: 0,
        created_at: new Date().toLocaleString()
      }
      
      if (temp.parent_id === 0) {
        // 顶级分类
        list.value.unshift(newCategory)
        parentCategories.value.unshift(newCategory)
      } else {
        // 子分类
        const parent = findCategoryById(list.value, temp.parent_id)
        if (parent) {
          if (!parent.children) {
            parent.children = []
          }
          parent.children.unshift(newCategory)
        }
      }
      
      dialogFormVisible.value = false
      ElMessage({
        message: '创建成功',
        type: 'success'
      })
    }
    
    const updateData = () => {
      const category = findCategoryById(list.value, temp.id)
      if (category) {
        Object.assign(category, temp)
        dialogFormVisible.value = false
        ElMessage({
          message: '更新成功',
          type: 'success'
        })
      }
    }
    
    const findCategoryById = (categories, id) => {
      for (const category of categories) {
        if (category.id === id) {
          return category
        }
        if (category.children) {
          const found = findCategoryById(category.children, id)
          if (found) return found
        }
      }
      return null
    }
    
    const removeCategoryById = (categories, id) => {
      for (let i = 0; i < categories.length; i++) {
        if (categories[i].id === id) {
          categories.splice(i, 1)
          return true
        }
        if (categories[i].children) {
          if (removeCategoryById(categories[i].children, id)) {
            return true
          }
        }
      }
      return false
    }
    
    const handleDelete = (row, index) => {
      let message = '此操作将永久删除该分类, 是否继续?'
      if (row.children && row.children.length > 0) {
        message = '该分类下还有子分类，删除后子分类也会被删除，是否继续?'
      }
      if (row.article_count > 0) {
        message = `该分类下还有 ${row.article_count} 篇文章，删除后文章将变为未分类，是否继续?`
      }
      
      ElMessageBox.confirm(message, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        removeCategoryById(list.value, row.id)
        // 同时从父级分类列表中移除
        const parentIndex = parentCategories.value.findIndex(item => item.id === row.id)
        if (parentIndex > -1) {
          parentCategories.value.splice(parentIndex, 1)
        }
        ElMessage({
          type: 'success',
          message: '删除成功!'
        })
      })
    }
    
    const handleModifyStatus = (row) => {
      const statusText = row.status === 1 ? '启用' : '禁用'
      ElMessage({
        message: `${statusText}成功`,
        type: 'success'
      })
    }
    
    const handleDownload = () => {
      downloadLoading.value = true
      setTimeout(() => {
        downloadLoading.value = false
        ElMessage({
          message: '导出功能开发中...',
          type: 'info'
        })
      }, 1000)
    }
    
    onMounted(() => {
      getList()
    })
    
    return {
      tableKey,
      list,
      total,
      listLoading,
      downloadLoading,
      dialogFormVisible,
      dialogStatus,
      dialogTitle,
      listQuery,
      temp,
      parentCategories,
      rules,
      getList,
      handleFilter,
      sortChange,
      handleCreate,
      handleAddChild,
      handleUpdate,
      createData,
      updateData,
      handleDelete,
      handleModifyStatus,
      handleDownload
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
  
  .filter-item {
    display: inline-block;
    vertical-align: middle;
    margin-bottom: 10px;
    margin-right: 10px;
  }
}

.category-name {
  display: flex;
  align-items: center;
  
  .category-icon {
    margin-right: 8px;
    color: #409eff;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.dialog-footer {
  text-align: right;
}
</style>