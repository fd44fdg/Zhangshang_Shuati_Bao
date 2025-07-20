<template>
  <div class="batch-question-form">
    <div class="form-header">
      <h4>题目 {{ index + 1 }}</h4>
      <el-button type="danger" size="small" icon="Delete" @click="$emit('remove', index)">
        删除
      </el-button>
    </div>
    
    <el-form :model="localQuestion" label-width="100px" size="small">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="题目标题" required>
            <el-input
              v-model="localQuestion.title"
              placeholder="请输入题目标题"
              maxlength="200"
              show-word-limit
              @input="updateQuestion"
            />
          </el-form-item>
          
          <el-form-item label="题目内容" required>
            <el-input
              v-model="localQuestion.content"
              type="textarea"
              :rows="3"
              placeholder="请输入题目内容"
              maxlength="1000"
              show-word-limit
              @input="updateQuestion"
            />
          </el-form-item>
          
          <el-form-item label="题目类型" required>
            <el-select
              v-model="localQuestion.type"
              placeholder="请选择题目类型"
              @change="handleTypeChange"
            >
              <el-option label="单选题" value="single" />
              <el-option label="多选题" value="multiple" />
              <el-option label="判断题" value="boolean" />
              <el-option label="填空题" value="fill" />
              <el-option label="简答题" value="essay" />
            </el-select>
          </el-form-item>
          
          <!-- 选项设置 -->
          <el-form-item v-if="needOptions" label="选项设置">
            <div class="options-container">
              <div v-for="(option, optIndex) in localQuestion.options" :key="optIndex" class="option-item">
                <div class="option-input">
                  <span class="option-label">{{ getOptionLabel(optIndex) }}</span>
                  <el-input
                    v-model="localQuestion.options[optIndex]"
                    :placeholder="`选项 ${getOptionLabel(optIndex)}`"
                    @input="updateQuestion"
                  />
                  <el-button
                    v-if="localQuestion.options.length > 2"
                    type="danger"
                    size="small"
                    icon="Delete"
                    circle
                    @click="removeOption(optIndex)"
                  />
                </div>
              </div>
              <el-button
                v-if="localQuestion.options.length < 6"
                type="primary"
                size="small"
                icon="Plus"
                @click="addOption"
              >
                添加选项
              </el-button>
            </div>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <!-- 正确答案 -->
          <el-form-item label="正确答案" required>
            <div v-if="localQuestion.type === 'single'">
              <el-radio-group v-model="localQuestion.correct_answer" @change="updateQuestion">
                <el-radio
                  v-for="(option, optIndex) in localQuestion.options"
                  :key="optIndex"
                  :label="optIndex"
                  :disabled="!option.trim()"
                >
                  {{ getOptionLabel(optIndex) }}. {{ option || '(请先填写选项)' }}
                </el-radio>
              </el-radio-group>
            </div>
            
            <div v-else-if="localQuestion.type === 'multiple'">
              <el-checkbox-group v-model="localQuestion.correct_answer" @change="updateQuestion">
                <el-checkbox
                  v-for="(option, optIndex) in localQuestion.options"
                  :key="optIndex"
                  :label="optIndex"
                  :disabled="!option.trim()"
                >
                  {{ getOptionLabel(optIndex) }}. {{ option || '(请先填写选项)' }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            
            <div v-else-if="localQuestion.type === 'boolean'">
              <el-radio-group v-model="localQuestion.correct_answer" @change="updateQuestion">
                <el-radio :label="0">正确</el-radio>
                <el-radio :label="1">错误</el-radio>
              </el-radio-group>
            </div>
            
            <div v-else-if="['fill', 'essay'].includes(localQuestion.type)">
              <el-input
                v-model="localQuestion.correct_answer"
                type="textarea"
                :rows="3"
                placeholder="请输入正确答案或参考答案"
                @input="updateQuestion"
              />
            </div>
          </el-form-item>
          
          <el-form-item label="题目解析">
            <el-input
              v-model="localQuestion.explanation"
              type="textarea"
              :rows="2"
              placeholder="请输入题目解析（可选）"
              @input="updateQuestion"
            />
          </el-form-item>
          
          <el-form-item label="难度等级">
            <el-select v-model="localQuestion.difficulty" @change="updateQuestion">
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
          
          <el-form-item label="题目分类">
            <el-select v-model="localQuestion.category_id" @change="updateQuestion">
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="知识点">
            <el-select
              v-model="localQuestion.knowledge_points"
              multiple
              filterable
              allow-create
              placeholder="请选择或输入知识点"
              @change="updateQuestion"
            >
              <el-option
                v-for="point in knowledgePoints"
                :key="point.value"
                :label="point.label"
                :value="point.value"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="标签">
            <el-select
              v-model="localQuestion.tags"
              multiple
              filterable
              allow-create
              placeholder="请输入标签"
              @change="updateQuestion"
            >
              <el-option
                v-for="tag in commonTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </el-form-item>
          
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="分值">
                <el-input-number
                  v-model="localQuestion.score"
                  :min="1"
                  :max="100"
                  :step="1"
                  size="small"
                  @change="updateQuestion"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态">
                <el-radio-group v-model="localQuestion.status" @change="updateQuestion">
                  <el-radio :label="1">启用</el-radio>
                  <el-radio :label="0">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </el-form>
    
    <!-- 快速操作 -->
    <div class="quick-actions">
      <el-button size="small" @click="copyFromPrevious">复制上一题</el-button>
      <el-button size="small" @click="clearForm">清空表单</el-button>
      <el-button size="small" type="success" @click="validateQuestion">
        {{ isValid ? '✓ 验证通过' : '验证表单' }}
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, inject } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'BatchQuestionForm',
  props: {
    modelValue: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    categories: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'remove'],
  setup(props, { emit }) {
    const localQuestion = reactive({ ...props.modelValue })
    const isValid = ref(false)
    
    // 常用数据
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
    
    const commonTags = ref([
      '前端', '后端', '数据库', '算法', '网络', '操作系统',
      '基础', '进阶', '实战', '面试', '项目'
    ])
    
    // 计算属性
    const needOptions = computed(() => {
      return ['single', 'multiple', 'boolean'].includes(localQuestion.type)
    })
    
    // 监听props变化
    watch(() => props.modelValue, (newVal) => {
      Object.assign(localQuestion, newVal)
    }, { deep: true })
    
    // 方法
    const updateQuestion = () => {
      emit('update:modelValue', { ...localQuestion })
      validateQuestion()
    }
    
    const handleTypeChange = (type) => {
      if (type === 'boolean') {
        localQuestion.options = ['正确', '错误']
        localQuestion.correct_answer = ''
      } else if (['fill', 'essay'].includes(type)) {
        localQuestion.options = []
        localQuestion.correct_answer = ''
      } else if (type === 'multiple') {
        localQuestion.options = ['', '']
        localQuestion.correct_answer = []
      } else {
        localQuestion.options = ['', '']
        localQuestion.correct_answer = ''
      }
      updateQuestion()
    }
    
    const getOptionLabel = (index) => {
      return String.fromCharCode(65 + index)
    }
    
    const addOption = () => {
      if (localQuestion.options.length < 6) {
        localQuestion.options.push('')
        updateQuestion()
      }
    }
    
    const removeOption = (index) => {
      if (localQuestion.options.length > 2) {
        localQuestion.options.splice(index, 1)
        // 调整正确答案
        if (localQuestion.type === 'single' && localQuestion.correct_answer === index) {
          localQuestion.correct_answer = ''
        } else if (localQuestion.type === 'multiple') {
          const answerIndex = localQuestion.correct_answer.indexOf(index)
          if (answerIndex > -1) {
            localQuestion.correct_answer.splice(answerIndex, 1)
          }
          localQuestion.correct_answer = localQuestion.correct_answer.map(ans => 
            ans > index ? ans - 1 : ans
          )
        }
        updateQuestion()
      }
    }
    
    const copyFromPrevious = () => {
      if (props.index > 0) {
        // 这里需要从父组件获取上一题的数据
        ElMessage.info('复制上一题功能需要父组件支持')
      } else {
        ElMessage.warning('这是第一题，无法复制上一题')
      }
    }
    
    const clearForm = () => {
      Object.assign(localQuestion, {
        title: '',
        content: '',
        type: 'single',
        options: ['', ''],
        correct_answer: '',
        explanation: '',
        difficulty: 'easy',
        category_id: '',
        knowledge_points: [],
        tags: [],
        score: 5,
        status: 1
      })
      updateQuestion()
      ElMessage.success('表单已清空')
    }
    
    const validateQuestion = () => {
      const errors = []
      
      if (!localQuestion.title?.trim()) {
        errors.push('题目标题不能为空')
      }
      
      if (!localQuestion.content?.trim()) {
        errors.push('题目内容不能为空')
      }
      
      if (!localQuestion.type) {
        errors.push('请选择题目类型')
      }
      
      if (needOptions.value) {
        const validOptions = localQuestion.options.filter(opt => opt?.trim())
        if (validOptions.length < 2) {
          errors.push('至少需要2个有效选项')
        }
      }
      
      if (localQuestion.type === 'single' && localQuestion.correct_answer === '') {
        errors.push('请选择正确答案')
      } else if (localQuestion.type === 'multiple' && (!localQuestion.correct_answer || localQuestion.correct_answer.length === 0)) {
        errors.push('请选择正确答案')
      } else if (['fill', 'essay'].includes(localQuestion.type) && !localQuestion.correct_answer?.trim()) {
        errors.push('请填写正确答案')
      }
      
      if (!localQuestion.category_id) {
        errors.push('请选择题目分类')
      }
      
      isValid.value = errors.length === 0
      
      if (errors.length > 0) {
        ElMessage.warning(`验证失败：${errors.join('；')}`)
      } else {
        ElMessage.success('验证通过')
      }
      
      return isValid.value
    }
    
    return {
      localQuestion,
      isValid,
      knowledgePoints,
      commonTags,
      needOptions,
      updateQuestion,
      handleTypeChange,
      getOptionLabel,
      addOption,
      removeOption,
      copyFromPrevious,
      clearForm,
      validateQuestion
    }
  }
}
</script>

<style scoped>
.batch-question-form {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #fff;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.form-header h4 {
  margin: 0;
  color: #303133;
}

.options-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  background-color: #fafafa;
}

.option-item {
  margin-bottom: 10px;
}

.option-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-label {
  font-weight: bold;
  min-width: 20px;
  color: #606266;
  font-size: 14px;
}

.quick-actions {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 10px;
}

.el-form-item {
  margin-bottom: 15px;
}

.el-form-item__label {
  font-size: 13px;
}
</style>