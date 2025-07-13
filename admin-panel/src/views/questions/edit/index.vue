<template>
  <div class="app-container">
    <div class="edit-container">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>编辑题目</span>
            <el-button type="text" @click="$router.go(-1)">返回</el-button>
          </div>
        </template>
        
        <div v-loading="loading" class="form-container">
          <el-form
            ref="questionFormRef"
            :model="questionForm"
            :rules="rules"
            label-width="120px"
            class="question-form"
          >
            <el-form-item label="题目ID">
              <el-input v-model="questionForm.id" disabled />
            </el-form-item>
            
            <el-form-item label="题目内容" prop="content">
              <el-input
                v-model="questionForm.content"
                type="textarea"
                :rows="4"
                placeholder="请输入题目内容"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="题目类型" prop="type">
              <el-select
                v-model="questionForm.type"
                placeholder="请选择题目类型"
                style="width: 200px"
                @change="handleTypeChange"
              >
                <el-option label="单选题" value="single" />
                <el-option label="多选题" value="multiple" />
                <el-option label="判断题" value="boolean" />
                <el-option label="填空题" value="fill" />
              </el-select>
            </el-form-item>
            
            <el-form-item v-if="questionForm.type !== 'fill'" label="选项设置" prop="options">
              <div class="options-container">
                <div v-for="(option, index) in questionForm.options" :key="index" class="option-item">
                  <div class="option-input">
                    <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
                    <el-input
                      v-model="questionForm.options[index]"
                      :placeholder="`请输入选项 ${String.fromCharCode(65 + index)}`"
                      maxlength="200"
                      show-word-limit
                    />
                    <el-button
                      v-if="questionForm.options.length > getMinOptions()"
                      type="danger"
                      size="small"
                      icon="Delete"
                      circle
                      @click="removeOption(index)"
                    />
                  </div>
                </div>
                <el-button
                  v-if="questionForm.options.length < 8"
                  type="primary"
                  size="small"
                  icon="Plus"
                  @click="addOption"
                >
                  添加选项
                </el-button>
              </div>
            </el-form-item>
            
            <el-form-item label="正确答案" prop="correct_answer">
              <!-- 单选题 -->
              <el-radio-group
                v-if="questionForm.type === 'single'"
                v-model="questionForm.correct_answer"
              >
                <el-radio
                  v-for="(option, index) in questionForm.options"
                  :key="index"
                  :label="index"
                  :disabled="!option.trim()"
                >
                  {{ String.fromCharCode(65 + index) }}. {{ option || '(请先填写选项内容)' }}
                </el-radio>
              </el-radio-group>
              
              <!-- 多选题 -->
              <el-checkbox-group
                v-else-if="questionForm.type === 'multiple'"
                v-model="questionForm.correct_answer"
              >
                <el-checkbox
                  v-for="(option, index) in questionForm.options"
                  :key="index"
                  :label="index"
                  :disabled="!option.trim()"
                >
                  {{ String.fromCharCode(65 + index) }}. {{ option || '(请先填写选项内容)' }}
                </el-checkbox>
              </el-checkbox-group>
              
              <!-- 判断题 -->
              <el-radio-group
                v-else-if="questionForm.type === 'boolean'"
                v-model="questionForm.correct_answer"
              >
                <el-radio :label="0">正确</el-radio>
                <el-radio :label="1">错误</el-radio>
              </el-radio-group>
              
              <!-- 填空题 -->
              <el-input
                v-else-if="questionForm.type === 'fill'"
                v-model="questionForm.correct_answer"
                placeholder="请输入正确答案，多个答案用分号分隔"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="题目解析" prop="explanation">
              <el-input
                v-model="questionForm.explanation"
                type="textarea"
                :rows="3"
                placeholder="请输入题目解析（可选）"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="难度等级" prop="difficulty">
              <el-select v-model="questionForm.difficulty" placeholder="请选择难度等级" style="width: 150px">
                <el-option label="简单" value="easy">
                  <span style="color: #67C23A">● 简单</span>
                </el-option>
                <el-option label="中等" value="medium">
                  <span style="color: #E6A23C">● 中等</span>
                </el-option>
                <el-option label="困难" value="hard">
                  <span style="color: #F56C6C">● 困难</span>
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="题目分类" prop="category">
              <el-select v-model="questionForm.category" placeholder="请选择题目分类" style="width: 200px">
                <el-option label="前端开发" value="frontend" />
                <el-option label="后端开发" value="backend" />
                <el-option label="数据库" value="database" />
                <el-option label="算法与数据结构" value="algorithm" />
                <el-option label="计算机网络" value="network" />
                <el-option label="操作系统" value="os" />
                <el-option label="软件工程" value="software" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="知识点" prop="knowledge_points">
              <el-select
                v-model="questionForm.knowledge_points"
                multiple
                filterable
                allow-create
                placeholder="请选择或输入知识点"
                style="width: 100%"
              >
                <el-option
                  v-for="point in knowledgePoints"
                  :key="point.value"
                  :label="point.label"
                  :value="point.value"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="标签" prop="tags">
              <el-input
                v-model="questionForm.tags"
                placeholder="请输入标签，用逗号分隔"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="分值" prop="score">
              <el-input-number
                v-model="questionForm.score"
                :min="1"
                :max="100"
                :step="1"
                placeholder="题目分值"
              />
            </el-form-item>
            
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="questionForm.status">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="创建时间">
              <el-input v-model="questionForm.created_at" disabled />
            </el-form-item>
            
            <el-form-item label="更新时间">
              <el-input v-model="questionForm.updated_at" disabled />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="submitForm" :loading="submitting">
                {{ submitting ? '保存中...' : '保存修改' }}
              </el-button>
              <el-button @click="resetForm">重置</el-button>
              <el-button type="info" @click="previewQuestion">预览</el-button>
              <el-button type="warning" @click="saveDraft">保存草稿</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>
    
    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="题目预览" width="600px">
      <div class="preview-container">
        <div class="question-header">
          <el-tag :type="getDifficultyType(questionForm.difficulty)">
            {{ getDifficultyLabel(questionForm.difficulty) }}
          </el-tag>
          <el-tag type="info" style="margin-left: 10px">
            {{ getTypeLabel(questionForm.type) }}
          </el-tag>
          <span style="float: right; color: #909399">分值: {{ questionForm.score }}分</span>
        </div>
        
        <div class="question-content">
          <h3>{{ questionForm.content || '(题目内容为空)' }}</h3>
          
          <div v-if="questionForm.type !== 'fill' && questionForm.options.length > 0" class="options">
            <div v-for="(option, index) in questionForm.options" :key="index" class="option-item">
              <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
              <span>{{ option || '(选项内容为空)' }}</span>
              <el-tag v-if="isCorrectAnswer(index)" type="success" size="small" style="margin-left: 10px">
                正确答案
              </el-tag>
            </div>
          </div>
          
          <div v-if="questionForm.type === 'fill'" class="fill-answer">
            <p><strong>正确答案：</strong>{{ questionForm.correct_answer }}</p>
          </div>
          
          <div v-if="questionForm.explanation" class="explanation">
            <h4>解析：</h4>
            <p>{{ questionForm.explanation }}</p>
          </div>
          
          <div class="meta-info">
            <p><strong>分类：</strong>{{ getCategoryLabel(questionForm.category) }}</p>
            <p v-if="questionForm.knowledge_points.length > 0">
              <strong>知识点：</strong>{{ questionForm.knowledge_points.join(', ') }}
            </p>
            <p v-if="questionForm.tags">
              <strong>标签：</strong>{{ questionForm.tags }}
            </p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { fetchQuestion, updateQuestion } from '@/api/question'
import { ElNotification } from 'element-plus'

export default {
  name: 'QuestionEdit',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const questionFormRef = ref(null)
    const loading = ref(false)
    const submitting = ref(false)
    const previewVisible = ref(false)
    
    const questionForm = reactive({
      id: null,
      title: '',
      content: '',
      type: 'single',
      options: [],
      correct_answer: null,
      explanation: '',
      difficulty: 'easy',
      category: '',
      knowledge_points: [],
      tags: '',
      score: 5,
      status: 1,
      created_at: '',
      updated_at: ''
    })
    
    const knowledgePoints = ref([
      { label: 'HTML基础', value: 'html-basic' },
      { label: 'CSS样式', value: 'css-style' },
      { label: 'JavaScript语法', value: 'js-syntax' },
      { label: 'Vue.js框架', value: 'vue-framework' },
      { label: 'React框架', value: 'react-framework' },
      { label: 'Node.js', value: 'nodejs' },
      { label: 'MySQL数据库', value: 'mysql' },
      { label: '数据结构', value: 'data-structure' },
      { label: '算法设计', value: 'algorithm-design' }
    ])
    
    const rules = {
      content: [
        { required: true, message: '请输入题目内容', trigger: 'blur' },
        { min: 5, message: '题目内容至少5个字符', trigger: 'blur' }
      ],
      type: [
        { required: true, message: '请选择题目类型', trigger: 'change' }
      ],
      options: [
        {
          validator: (rule, value, callback) => {
            if (questionForm.type === 'fill') {
              callback()
              return
            }
            const validOptions = value.filter(option => option.trim())
            if (validOptions.length < getMinOptions()) {
              callback(new Error(`${getTypeLabel(questionForm.type)}至少需要${getMinOptions()}个选项`))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      correct_answer: [
        {
          validator: (rule, value, callback) => {
            if (questionForm.type === 'multiple') {
              if (!Array.isArray(value) || value.length === 0) {
                callback(new Error('多选题至少选择一个正确答案'))
              } else {
                callback()
              }
            } else if (questionForm.type === 'fill') {
              if (!value || !value.trim()) {
                callback(new Error('请输入正确答案'))
              } else {
                callback()
              }
            } else {
              if (value === '' || value === null || value === undefined) {
                callback(new Error('请选择正确答案'))
              } else {
                callback()
              }
            }
          },
          trigger: 'change'
        }
      ],
      difficulty: [
        { required: true, message: '请选择难度等级', trigger: 'change' }
      ],
      category: [
        { required: true, message: '请选择题目分类', trigger: 'change' }
      ],
      score: [
        { required: true, message: '请设置题目分值', trigger: 'blur' }
      ]
    }
    
    const getMinOptions = () => {
      return questionForm.type === 'boolean' ? 2 : 2
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
    
    const getCategoryLabel = (category) => {
      const labelMap = {
        frontend: '前端开发',
        backend: '后端开发',
        database: '数据库',
        algorithm: '算法与数据结构',
        network: '计算机网络',
        os: '操作系统',
        software: '软件工程'
      }
      return labelMap[category] || category
    }
    
    const isCorrectAnswer = (index) => {
      if (Array.isArray(questionForm.correct_answer)) {
        return questionForm.correct_answer.includes(index)
      }
      return questionForm.correct_answer === index
    }
    
    const getQuestionDetail = () => {
      const id = route.params.id
      if (id) {
        fetchQuestion(id).then(response => {
          Object.assign(questionForm, response.question)
        })
      }
    }
    
    const handleTypeChange = (type) => {
      if (type === 'boolean') {
        questionForm.options = ['正确', '错误']
        questionForm.correct_answer = null
      } else if (type === 'fill') {
        questionForm.options = []
        questionForm.correct_answer = null
      } else if (type === 'multiple') {
        if (!Array.isArray(questionForm.correct_answer)) {
          questionForm.correct_answer = []
        }
      } else {
        if (Array.isArray(questionForm.correct_answer)) {
          questionForm.correct_answer = null
        }
      }
    }
    
    const addOption = () => {
      if (questionForm.options.length < 8) {
        questionForm.options.push('')
      }
    }
    
    const removeOption = (index) => {
      if (questionForm.options.length > getMinOptions()) {
        questionForm.options.splice(index, 1)
        // 如果删除的选项是正确答案，需要重置正确答案
        if (questionForm.type === 'single' && questionForm.correct_answer === index) {
          questionForm.correct_answer = null
        } else if (questionForm.type === 'multiple') {
          const answerIndex = questionForm.correct_answer.indexOf(index)
          if (answerIndex > -1) {
            questionForm.correct_answer.splice(answerIndex, 1)
          }
          // 调整其他答案的索引
          questionForm.correct_answer = questionForm.correct_answer.map(ans => 
            ans > index ? ans - 1 : ans
          )
        }
      }
    }
    
    const submitForm = () => {
      questionFormRef.value.validate((valid) => {
        if (valid) {
          submitting.value = true
          // 准备提交给后端的数据，需要转换为 snake_case
          const dataToSend = {
            title: questionForm.title,
            content: questionForm.content,
            type: questionForm.type,
            options: JSON.stringify(questionForm.options),
            correct_answer: JSON.stringify(questionForm.correct_answer),
            explanation: questionForm.explanation,
            difficulty: questionForm.difficulty,
            category_id: questionForm.category,
            tags: JSON.stringify(questionForm.tags),
            score: questionForm.score,
            status: questionForm.status
          }
          updateQuestion(questionForm.id, dataToSend).then(() => {
            submitting.value = false
            questionForm.updated_at = new Date().toLocaleString()
            ElNotification({
              title: '成功',
              message: '题目更新成功',
              type: 'success'
            })
            router.push('/questions/list')
          })
        } else {
          ElMessage({
            message: '请检查表单填写是否完整',
            type: 'error'
          })
        }
      })
    }
    
    const resetForm = () => {
      ElMessageBox.confirm('确定要重置表单吗？所有修改将被撤销。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        getQuestionDetail()
        ElMessage({
          message: '表单已重置',
          type: 'success'
        })
      })
    }
    
    const saveDraft = () => {
      ElMessage({
        message: '草稿保存成功',
        type: 'success'
      })
    }
    
    const previewQuestion = () => {
      previewVisible.value = true
    }
    
    onMounted(() => {
      getQuestionDetail()
    })
    
    return {
      questionFormRef,
      loading,
      submitting,
      previewVisible,
      questionForm,
      knowledgePoints,
      rules,
      getMinOptions,
      getTypeLabel,
      getDifficultyType,
      getDifficultyLabel,
      getCategoryLabel,
      isCorrectAnswer,
      handleTypeChange,
      addOption,
      removeOption,
      submitForm,
      resetForm,
      saveDraft,
      previewQuestion
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.edit-container {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-container {
  min-height: 400px;
}

.question-form {
  padding: 20px 0;
}

.options-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  background-color: #fafafa;
}

.option-item {
  margin-bottom: 15px;
}

.option-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-label {
  font-weight: bold;
  min-width: 25px;
  color: #606266;
}

.preview-container {
  .question-header {
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
  }
  
  .question-content {
    h3 {
      color: #303133;
      margin-bottom: 15px;
    }
    
    .options {
      margin: 15px 0;
      
      .option-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        
        .option-label {
          font-weight: bold;
          margin-right: 8px;
          min-width: 25px;
          color: #606266;
        }
      }
    }
    
    .fill-answer {
      margin: 15px 0;
      padding: 10px;
      background-color: #f0f9ff;
      border-radius: 4px;
      
      p {
        margin: 0;
        color: #409eff;
      }
    }
    
    .explanation {
      margin-top: 20px;
      padding: 15px;
      background-color: #f5f7fa;
      border-radius: 4px;
      
      h4 {
        margin: 0 0 10px 0;
        color: #409eff;
      }
      
      p {
        margin: 0;
        color: #606266;
      }
    }
    
    .meta-info {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #ebeef5;
      
      p {
        margin: 5px 0;
        color: #909399;
        font-size: 14px;
      }
    }
  }
}

:deep(.el-radio),
:deep(.el-checkbox) {
  display: block;
  margin-bottom: 10px;
  margin-right: 0;
}

:deep(.el-radio__label),
:deep(.el-checkbox__label) {
  white-space: normal;
  line-height: 1.5;
}
</style>