<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="搜索题目内容"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleFilter"
      />
      <el-select
        v-model="listQuery.type"
        placeholder="题目类型"
        clearable
        style="width: 120px"
        class="filter-item"
      >
        <el-option label="单选题" value="single" />
        <el-option label="多选题" value="multiple" />
        <el-option label="判断题" value="boolean" />
        <el-option label="填空题" value="fill" />
      </el-select>
      <el-select
        v-model="listQuery.difficulty"
        placeholder="难度"
        clearable
        style="width: 120px"
        class="filter-item"
      >
        <el-option label="简单" value="easy" />
        <el-option label="中等" value="medium" />
        <el-option label="困难" value="hard" />
      </el-select>
      <el-select
        v-model="listQuery.category"
        placeholder="分类"
        clearable
        style="width: 150px"
        class="filter-item"
      >
        <el-option label="前端开发" value="frontend" />
        <el-option label="后端开发" value="backend" />
        <el-option label="数据库" value="database" />
        <el-option label="算法" value="algorithm" />
      </el-select>
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
        添加题目
      </el-button>
      <el-button
        class="filter-item"
        type="success"
        icon="Upload"
        @click="handleImport"
      >
        批量导入
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
      <el-table-column label="题目内容" min-width="300px">
        <template #default="{row}">
          <div class="question-content">
            <p>{{ row.content }}</p>
            <div v-if="row.type !== 'fill'" class="options">
              <div v-for="(option, index) in row.options" :key="index" class="option-item">
                <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
                <span>{{ option }}</span>
                <el-tag v-if="isCorrectAnswer(row, index)" type="success" size="small">正确答案</el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="100px" align="center">
        <template #default="{row}">
          <el-tag :type="getTypeColor(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="难度" width="100px" align="center">
        <template #default="{row}">
          <el-tag :type="getDifficultyType(row.difficulty)">{{ getDifficultyLabel(row.difficulty) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="120px" align="center">
        <template #default="{row}">
          <el-tag :type="getCategoryType(row.category)">{{ getCategoryLabel(row.category) }}</el-tag>
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

    <!-- 题目编辑对话框 -->
    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="800px">
      <el-form
        ref="dataFormRef"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="100px"
        style="width: 700px; margin-left:50px;"
      >
        <el-form-item label="题目内容" prop="content">
          <el-input
            v-model="temp.content"
            type="textarea"
            :rows="3"
            placeholder="请输入题目内容"
          />
        </el-form-item>
        <el-form-item label="题目类型" prop="type">
          <el-select v-model="temp.type" placeholder="请选择题目类型" style="width: 100%" @change="handleTypeChange">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="boolean" />
            <el-option label="填空题" value="fill" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="temp.type !== 'fill'" label="选项" prop="options">
          <div v-for="(option, index) in temp.options" :key="index" class="option-input">
            <el-input
              v-model="temp.options[index]"
              :placeholder="`选项 ${String.fromCharCode(65 + index)}`"
              style="width: 80%; margin-bottom: 10px;"
            />
            <el-button
              v-if="temp.options.length > 2"
              type="danger"
              size="small"
              icon="Delete"
              style="margin-left: 10px;"
              @click="removeOption(index)"
            />
          </div>
          <el-button type="primary" size="small" icon="Plus" @click="addOption">
            添加选项
          </el-button>
        </el-form-item>
        <el-form-item label="正确答案" prop="correct_answer">
          <el-select
            v-if="temp.type === 'single'"
            v-model="temp.correct_answer"
            placeholder="请选择正确答案"
            style="width: 100%"
          >
            <el-option
              v-for="(option, index) in temp.options"
              :key="index"
              :label="`${String.fromCharCode(65 + index)}. ${option}`"
              :value="index"
            />
          </el-select>
          <el-select
            v-else-if="temp.type === 'multiple'"
            v-model="temp.correct_answer"
            multiple
            placeholder="请选择正确答案（多选）"
            style="width: 100%"
          >
            <el-option
              v-for="(option, index) in temp.options"
              :key="index"
              :label="`${String.fromCharCode(65 + index)}. ${option}`"
              :value="index"
            />
          </el-select>
          <el-select
            v-else-if="temp.type === 'boolean'"
            v-model="temp.correct_answer"
            placeholder="请选择正确答案"
            style="width: 100%"
          >
            <el-option label="正确" :value="0" />
            <el-option label="错误" :value="1" />
          </el-select>
          <el-input
            v-else
            v-model="temp.correct_answer"
            placeholder="请输入正确答案"
          />
        </el-form-item>
        <el-form-item label="解析" prop="explanation">
          <el-input
            v-model="temp.explanation"
            type="textarea"
            :rows="3"
            placeholder="请输入题目解析"
          />
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="temp.difficulty" placeholder="请选择难度" style="width: 100%">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="temp.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="前端开发" value="frontend" />
            <el-option label="后端开发" value="backend" />
            <el-option label="数据库" value="database" />
            <el-option label="算法" value="algorithm" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-input v-model="temp.tags" placeholder="请输入标签，用逗号分隔" />
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
  name: 'QuestionList',
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
      keyword: '',
      type: '',
      difficulty: '',
      category: ''
    })
    
    const temp = reactive({
      id: undefined,
      content: '',
      type: 'single',
      options: ['', ''],
      correct_answer: '',
      explanation: '',
      difficulty: 'easy',
      category: '',
      tags: '',
      status: 1
    })
    
    const textMap = {
      update: '编辑题目',
      create: '创建题目'
    }
    
    const rules = {
      content: [{ required: true, message: '题目内容是必填项', trigger: 'blur' }],
      type: [{ required: true, message: '题目类型是必填项', trigger: 'change' }],
      correct_answer: [{ required: true, message: '正确答案是必填项', trigger: 'blur' }],
      difficulty: [{ required: true, message: '难度是必填项', trigger: 'change' }],
      category: [{ required: true, message: '分类是必填项', trigger: 'change' }]
    }
    
    // 模拟数据
    const mockData = [
      {
        id: 1,
        content: 'JavaScript中用于声明变量的关键字有哪些？',
        type: 'multiple',
        options: ['var', 'let', 'const', 'function'],
        correct_answer: [0, 1, 2],
        explanation: 'JavaScript中可以使用var、let、const来声明变量',
        difficulty: 'easy',
        category: 'frontend',
        tags: 'JavaScript,变量',
        status: 1,
        created_at: '2024-01-15 10:30:00'
      },
      {
        id: 2,
        content: 'Vue.js是一个渐进式JavaScript框架',
        type: 'boolean',
        options: ['正确', '错误'],
        correct_answer: 0,
        explanation: 'Vue.js确实是一个渐进式的JavaScript框架',
        difficulty: 'easy',
        category: 'frontend',
        tags: 'Vue.js,框架',
        status: 1,
        created_at: '2024-01-14 16:20:00'
      },
      {
        id: 3,
        content: '以下哪个是MySQL的存储引擎？',
        type: 'single',
        options: ['InnoDB', 'Redis', 'MongoDB', 'SQLite'],
        correct_answer: 0,
        explanation: 'InnoDB是MySQL的默认存储引擎',
        difficulty: 'medium',
        category: 'database',
        tags: 'MySQL,存储引擎',
        status: 1,
        created_at: '2024-01-13 14:15:00'
      }
    ]
    
    const getTypeColor = (type) => {
      const colorMap = {
        single: 'primary',
        multiple: 'success',
        boolean: 'warning',
        fill: 'info'
      }
      return colorMap[type] || ''
    }
    
    const getTypeLabel = (type) => {
      const labelMap = {
        single: '单选题',
        multiple: '多选题',
        boolean: '判断题',
        fill: '填空题'
      }
      return labelMap[type] || type
    }
    
    const getDifficultyType = (difficulty) => {
      const typeMap = {
        easy: 'success',
        medium: 'warning',
        hard: 'danger'
      }
      return typeMap[difficulty] || ''
    }
    
    const getDifficultyLabel = (difficulty) => {
      const labelMap = {
        easy: '简单',
        medium: '中等',
        hard: '困难'
      }
      return labelMap[difficulty] || difficulty
    }
    
    const getCategoryType = (category) => {
      const typeMap = {
        frontend: 'primary',
        backend: 'success',
        database: 'warning',
        algorithm: 'danger'
      }
      return typeMap[category] || ''
    }
    
    const getCategoryLabel = (category) => {
      const labelMap = {
        frontend: '前端开发',
        backend: '后端开发',
        database: '数据库',
        algorithm: '算法'
      }
      return labelMap[category] || category
    }
    
    const isCorrectAnswer = (row, index) => {
      if (Array.isArray(row.correct_answer)) {
        return row.correct_answer.includes(index)
      }
      return row.correct_answer === index
    }
    
    const getList = () => {
      listLoading.value = true
      setTimeout(() => {
        let filteredData = mockData
        if (listQuery.keyword) {
          filteredData = filteredData.filter(item => 
            item.content.toLowerCase().includes(listQuery.keyword.toLowerCase())
          )
        }
        if (listQuery.type) {
          filteredData = filteredData.filter(item => item.type === listQuery.type)
        }
        if (listQuery.difficulty) {
          filteredData = filteredData.filter(item => item.difficulty === listQuery.difficulty)
        }
        if (listQuery.category) {
          filteredData = filteredData.filter(item => item.category === listQuery.category)
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
      temp.content = ''
      temp.type = 'single'
      temp.options = ['', '']
      temp.correct_answer = ''
      temp.explanation = ''
      temp.difficulty = 'easy'
      temp.category = ''
      temp.tags = ''
      temp.status = 1
    }
    
    const handleCreate = () => {
      resetTemp()
      dialogStatus.value = 'create'
      dialogFormVisible.value = true
    }
    
    const handleTypeChange = (type) => {
      if (type === 'boolean') {
        temp.options = ['正确', '错误']
      } else if (type === 'fill') {
        temp.options = []
      } else {
        temp.options = ['', '']
      }
      temp.correct_answer = ''
    }
    
    const addOption = () => {
      temp.options.push('')
    }
    
    const removeOption = (index) => {
      temp.options.splice(index, 1)
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
      Object.assign(temp, JSON.parse(JSON.stringify(row)))
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
      ElMessageBox.confirm('此操作将永久删除该题目, 是否继续?', '提示', {
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
    
    const handleImport = () => {
      ElMessageBox.confirm(
        '批量导入将会上传CSV格式的题目文件，确定继续吗？',
        '批量导入确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        // 创建文件输入元素
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.style.display = 'none';
        
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            handleFileImport(file);
          }
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
      }).catch(() => {
        ElMessage.info('已取消导入');
      });
    }
    
    // 处理文件导入
    const handleFileImport = (file) => {
      const loading = ElLoading.service({
        lock: true,
        text: '正在导入数据...',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n');
          const headers = lines[0].split(',');
          
          // 验证CSV格式
          const requiredHeaders = ['标题', '内容', '类型', '选项', '正确答案', '解释', '难度', '分类'];
          const hasValidHeaders = requiredHeaders.every(header => 
            headers.some(h => h.trim().includes(header))
          );
          
          if (!hasValidHeaders) {
            loading.close();
            ElMessage.error('CSV文件格式不正确，请检查表头是否包含必要字段');
            return;
          }
          
          // 模拟导入过程
          setTimeout(() => {
            loading.close();
            const importCount = Math.max(1, lines.length - 1); // 减去表头行
            ElMessage.success(`成功导入 ${importCount} 道题目！`);
            
            // 刷新列表
            getList();
          }, 3000);
          
        } catch (error) {
          loading.close();
          ElMessage.error('文件解析失败，请检查文件格式');
        }
      };
      
      reader.onerror = () => {
        loading.close();
        ElMessage.error('文件读取失败');
      };
      
      reader.readAsText(file, 'UTF-8');
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
      getTypeColor,
      getTypeLabel,
      getDifficultyType,
      getDifficultyLabel,
      getCategoryType,
      getCategoryLabel,
      isCorrectAnswer,
      getList,
      handleFilter,
      handleCreate,
      handleTypeChange,
      addOption,
      removeOption,
      createData,
      handleUpdate,
      updateData,
      handleDelete,
      handleModifyStatus,
      handleImport,
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
  margin-right: 10px;
}

.question-content {
  .options {
    margin-top: 10px;
    
    .option-item {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
      
      .option-label {
        font-weight: bold;
        margin-right: 8px;
        min-width: 20px;
      }
      
      .el-tag {
        margin-left: 10px;
      }
    }
  }
}

.option-input {
  display: flex;
  align-items: center;
}
</style>