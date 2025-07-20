<template>
  <div class="app-container">
    <div class="create-container">
      <!-- 创建方式选择 -->
      <el-card class="mode-selector">
        <el-radio-group v-model="createMode" @change="handleModeChange">
          <el-radio-button label="single">单个创建</el-radio-button>
          <el-radio-button label="batch">批量创建</el-radio-button>
          <el-radio-button label="import">Excel导入</el-radio-button>
          <el-radio-button label="template">模板创建</el-radio-button>
        </el-radio-group>
      </el-card>

      <!-- 单个创建模式 -->
      <el-card v-if="createMode === 'single'" class="box-card">
        <template #header>
          <div class="card-header">
            <span>创建题目</span>
            <el-button type="text" @click="$router.go(-1)">返回</el-button>
          </div>
        </template>
        
        <el-form
          ref="questionFormRef"
          :model="questionForm"
          :rules="rules"
          label-width="120px"
          class="question-form"
        >
          <el-row :gutter="20">
            <el-col :span="16">
              <el-form-item label="题目标题" prop="title">
                <el-input
                  v-model="questionForm.title"
                  placeholder="请输入题目标题"
                  maxlength="200"
                  show-word-limit
                />
              </el-form-item>
              
              <el-form-item label="题目内容" prop="content">
                <div class="content-editor">
                  <el-tabs v-model="editorMode">
                    <el-tab-pane label="富文本编辑" name="rich">
                      <div ref="editorRef" class="rich-editor"></div>
                    </el-tab-pane>
                    <el-tab-pane label="Markdown" name="markdown">
                      <el-input
                        v-model="questionForm.content"
                        type="textarea"
                        :rows="8"
                        placeholder="请输入题目内容（支持Markdown语法）"
                      />
                    </el-tab-pane>
                  </el-tabs>
                </div>
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
                  <el-option label="简答题" value="essay" />
                  <el-option label="编程题" value="coding" />
                </el-select>
              </el-form-item>
              
              <!-- 选项设置 -->
              <el-form-item v-if="needOptions" label="选项设置" prop="options">
                <div class="options-container">
                  <div v-for="(option, index) in questionForm.options" :key="index" class="option-item">
                    <div class="option-input">
                      <span class="option-label">{{ getOptionLabel(index) }}</span>
                      <el-input
                        v-model="questionForm.options[index]"
                        :placeholder="`请输入选项 ${getOptionLabel(index)}`"
                        maxlength="500"
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
                    v-if="questionForm.options.length < 10"
                    type="primary"
                    size="small"
                    icon="Plus"
                    @click="addOption"
                  >
                    添加选项
                  </el-button>
                </div>
              </el-form-item>
              
              <!-- 正确答案 -->
              <el-form-item label="正确答案" prop="correct_answer">
                <div v-if="questionForm.type === 'single'">
                  <el-radio-group v-model="questionForm.correct_answer">
                    <el-radio
                      v-for="(option, index) in questionForm.options"
                      :key="index"
                      :label="index"
                      :disabled="!option.trim()"
                    >
                      {{ getOptionLabel(index) }}. {{ option || '(请先填写选项内容)' }}
                    </el-radio>
                  </el-radio-group>
                </div>
                
                <div v-else-if="questionForm.type === 'multiple'">
                  <el-checkbox-group v-model="questionForm.correct_answer">
                    <el-checkbox
                      v-for="(option, index) in questionForm.options"
                      :key="index"
                      :label="index"
                      :disabled="!option.trim()"
                    >
                      {{ getOptionLabel(index) }}. {{ option || '(请先填写选项内容)' }}
                    </el-checkbox>
                  </el-checkbox-group>
                </div>
                
                <div v-else-if="questionForm.type === 'boolean'">
                  <el-radio-group v-model="questionForm.correct_answer">
                    <el-radio :label="0">正确</el-radio>
                    <el-radio :label="1">错误</el-radio>
                  </el-radio-group>
                </div>
                
                <div v-else-if="['fill', 'essay', 'coding'].includes(questionForm.type)">
                  <el-input
                    v-model="questionForm.correct_answer"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入正确答案或参考答案"
                    maxlength="1000"
                    show-word-limit
                  />
                </div>
              </el-form-item>
              
              <el-form-item label="题目解析" prop="explanation">
                <el-input
                  v-model="questionForm.explanation"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入题目解析（可选）"
                  maxlength="1000"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            
            <el-col :span="8">
              <!-- 题目属性 -->
              <el-form-item label="难度等级" prop="difficulty">
                <el-select v-model="questionForm.difficulty" placeholder="请选择难度等级">
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
              
              <el-form-item label="题目分类" prop="category_id">
                <el-select v-model="questionForm.category_id" placeholder="请选择题目分类">
                  <el-option
                    v-for="category in categories"
                    :key="category.id"
                    :label="category.name"
                    :value="category.id"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="知识点" prop="knowledge_points">
                <el-select
                  v-model="questionForm.knowledge_points"
                  multiple
                  filterable
                  allow-create
                  placeholder="请选择或输入知识点"
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
                <el-select
                  v-model="questionForm.tags"
                  multiple
                  filterable
                  allow-create
                  placeholder="请输入标签"
                >
                  <el-option
                    v-for="tag in commonTags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  />
                </el-select>
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
              
              <el-form-item label="答题时限" prop="time_limit">
                <el-input-number
                  v-model="questionForm.time_limit"
                  :min="0"
                  :max="3600"
                  :step="30"
                  placeholder="秒数，0表示无限制"
                />
              </el-form-item>
              
              <el-form-item label="状态" prop="status">
                <el-radio-group v-model="questionForm.status">
                  <el-radio :label="1">启用</el-radio>
                  <el-radio :label="0">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <!-- 图片上传 -->
              <el-form-item label="题目图片">
                <el-upload
                  class="image-uploader"
                  action="/api/questions/upload"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :on-success="handleImageSuccess"
                  :before-upload="beforeImageUpload"
                >
                  <img v-if="questionForm.imageUrl" :src="questionForm.imageUrl" class="image" />
                  <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
                </el-upload>
              </el-form-item>
              
              <!-- 附件上传 -->
              <el-form-item label="附件">
                <el-upload
                  class="upload-demo"
                  action="/api/questions/upload"
                  :headers="uploadHeaders"
                  :file-list="questionForm.attachments"
                  :on-success="handleAttachmentSuccess"
                  :on-remove="handleAttachmentRemove"
                >
                  <el-button size="small" type="primary">点击上传</el-button>
                  <template #tip>
                    <div class="el-upload__tip">支持doc/pdf/zip等格式，单个文件不超过10MB</div>
                  </template>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item>
            <el-button type="primary" @click="submitForm" :loading="submitting">
              {{ submitting ? '创建中...' : '创建题目' }}
            </el-button>
            <el-button @click="resetForm">重置</el-button>
            <el-button @click="saveDraft">保存草稿</el-button>
            <el-button type="info" @click="previewQuestion">预览</el-button>
            <el-button @click="saveAsTemplate">保存为模板</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 批量创建模式 -->
      <el-card v-if="createMode === 'batch'" class="box-card">
        <template #header>
          <div class="card-header">
            <span>批量创建题目</span>
            <el-button type="text" @click="$router.go(-1)">返回</el-button>
          </div>
        </template>
        
        <div class="batch-create">
          <el-alert
            title="批量创建说明"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            <p>1. 每次最多可创建100道题目</p>
            <p>2. 请确保每道题目的必填字段都已填写完整</p>
            <p>3. 支持复制粘贴快速填写相似题目</p>
          </el-alert>
          
          <div class="batch-toolbar">
            <el-button type="primary" @click="addBatchQuestion">添加题目</el-button>
            <el-button @click="clearBatchQuestions">清空所有</el-button>
            <el-button type="success" @click="submitBatchQuestions" :loading="batchSubmitting">
              {{ batchSubmitting ? '创建中...' : `批量创建(${batchQuestions.length}道)` }}
            </el-button>
          </div>
          
          <div class="batch-questions">
            <el-collapse v-model="activeQuestions">
              <el-collapse-item
                v-for="(question, index) in batchQuestions"
                :key="index"
                :title="`题目 ${index + 1}: ${question.title || '未设置标题'}`"
                :name="index"
              >
                <batch-question-form
                  v-model="batchQuestions[index]"
                  :index="index"
                  :categories="categories"
                  @remove="removeBatchQuestion"
                />
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </el-card>

      <!-- Excel导入模式 -->
      <el-card v-if="createMode === 'import'" class="box-card">
        <template #header>
          <div class="card-header">
            <span>Excel批量导入</span>
            <el-button type="text" @click="$router.go(-1)">返回</el-button>
          </div>
        </template>
        
        <div class="import-section">
          <el-steps :active="importStep" finish-status="success">
            <el-step title="下载模板" />
            <el-step title="上传文件" />
            <el-step title="预览数据" />
            <el-step title="导入完成" />
          </el-steps>
          
          <div class="step-content">
            <!-- 步骤1: 下载模板 -->
            <div v-if="importStep === 0" class="step-1">
              <el-alert
                title="请先下载Excel模板，按照模板格式填写题目数据"
                type="info"
                :closable="false"
                style="margin-bottom: 20px"
              />
              <el-button type="primary" @click="downloadTemplate">下载Excel模板</el-button>
              <el-button @click="importStep = 1">跳过，直接上传</el-button>
            </div>
            
            <!-- 步骤2: 上传文件 -->
            <div v-if="importStep === 1" class="step-2">
              <el-upload
                class="upload-demo"
                drag
                action="/api/questions/import/excel"
                :headers="uploadHeaders"
                :on-success="handleImportSuccess"
                :on-error="handleImportError"
                :before-upload="beforeImportUpload"
                accept=".xlsx,.xls"
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  将Excel文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    只能上传xlsx/xls文件，且不超过10MB
                  </div>
                </template>
              </el-upload>
            </div>
            
            <!-- 步骤3: 预览数据 -->
            <div v-if="importStep === 2" class="step-3">
              <div class="import-result">
                <el-alert
                  :title="`解析完成：共${importResult.total}道题目，成功${importResult.success}道，失败${importResult.failed}道`"
                  :type="importResult.failed > 0 ? 'warning' : 'success'"
                  :closable="false"
                  style="margin-bottom: 20px"
                />
                
                <el-table :data="importResult.errors" v-if="importResult.errors.length > 0">
                  <el-table-column prop="index" label="行号" width="80" />
                  <el-table-column prop="error" label="错误信息" />
                </el-table>
                
                <div class="import-actions">
                  <el-button @click="importStep = 1">重新上传</el-button>
                  <el-button type="primary" @click="confirmImport">确认导入</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 模板创建模式 -->
      <el-card v-if="createMode === 'template'" class="box-card">
        <template #header>
          <div class="card-header">
            <span>从模板创建</span>
            <el-button type="text" @click="$router.go(-1)">返回</el-button>
          </div>
        </template>
        
        <div class="template-section">
          <el-row :gutter="20">
            <el-col :span="8">
              <h3>选择模板</h3>
              <el-input
                v-model="templateSearch"
                placeholder="搜索模板"
                prefix-icon="Search"
                style="margin-bottom: 20px"
              />
              <div class="template-list">
                <div
                  v-for="template in filteredTemplates"
                  :key="template.id"
                  class="template-item"
                  :class="{ active: selectedTemplate?.id === template.id }"
                  @click="selectTemplate(template)"
                >
                  <h4>{{ template.name }}</h4>
                  <p>{{ template.description }}</p>
                  <div class="template-meta">
                    <el-tag size="small">{{ template.creator_name }}</el-tag>
                    <span class="create-time">{{ formatDate(template.created_at) }}</span>
                  </div>
                </div>
              </div>
            </el-col>
            
            <el-col :span="16">
              <div v-if="selectedTemplate">
                <h3>模板预览</h3>
                <div class="template-preview">
                  <pre>{{ JSON.stringify(selectedTemplate.template_data, null, 2) }}</pre>
                </div>
                
                <h3>自定义修改</h3>
                <el-form :model="templateCustomData" label-width="120px">
                  <el-form-item label="题目标题">
                    <el-input v-model="templateCustomData.title" />
                  </el-form-item>
                  <el-form-item label="题目内容">
                    <el-input v-model="templateCustomData.content" type="textarea" :rows="4" />
                  </el-form-item>
                  <el-form-item label="难度等级">
                    <el-select v-model="templateCustomData.difficulty">
                      <el-option label="简单" value="easy" />
                      <el-option label="中等" value="medium" />
                      <el-option label="困难" value="hard" />
                    </el-select>
                  </el-form-item>
                </el-form>
                
                <el-button type="primary" @click="createFromTemplate" :loading="templateSubmitting">
                  {{ templateSubmitting ? '创建中...' : '从模板创建' }}
                </el-button>
              </div>
              <el-empty v-else description="请选择一个模板" />
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>
    
    <!-- 预览对话框 -->
    <question-preview-dialog
      v-model="previewVisible"
      :question="questionForm"
    />
    
    <!-- 保存模板对话框 -->
    <save-template-dialog
      v-model="saveTemplateVisible"
      :question-data="questionForm"
      @saved="handleTemplateSaved"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Plus, UploadFilled } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'
import { 
  createQuestion, 
  createBatchQuestions, 
  fetchQuestionCategories,
  fetchQuestionTemplates,
  createFromTemplate
} from '@/api/question'

// 子组件
import BatchQuestionForm from './components/BatchQuestionForm.vue'
import QuestionPreviewDialog from './components/QuestionPreviewDialog.vue'
import SaveTemplateDialog from './components/SaveTemplateDialog.vue'

export default {
  name: 'EnhancedQuestionCreate',
  components: {
    BatchQuestionForm,
    QuestionPreviewDialog,
    SaveTemplateDialog
  },
  setup() {
    const router = useRouter()
    const questionFormRef = ref(null)
    const editorRef = ref(null)
    
    // 创建模式
    const createMode = ref('single')
    const editorMode = ref('rich')
    
    // 表单数据
    const questionForm = reactive({
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
      time_limit: 0,
      status: 1,
      images: [],
      attachments: [],
      imageUrl: ''
    })
    
    // 批量创建
    const batchQuestions = ref([])
    const activeQuestions = ref([])
    const batchSubmitting = ref(false)
    
    // Excel导入
    const importStep = ref(0)
    const importResult = ref({
      total: 0,
      success: 0,
      failed: 0,
      errors: []
    })
    
    // 模板创建
    const templates = ref([])
    const selectedTemplate = ref(null)
    const templateSearch = ref('')
    const templateCustomData = reactive({})
    const templateSubmitting = ref(false)
    
    // 其他状态
    const submitting = ref(false)
    const previewVisible = ref(false)
    const saveTemplateVisible = ref(false)
    const categories = ref([])
    
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
      return ['single', 'multiple', 'boolean'].includes(questionForm.type)
    })
    
    const filteredTemplates = computed(() => {
      if (!templateSearch.value) return templates.value
      return templates.value.filter(t => 
        t.name.includes(templateSearch.value) || 
        t.description.includes(templateSearch.value)
      )
    })
    
    const uploadHeaders = computed(() => {
      return {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    
    // 表单验证规则
    const rules = {
      title: [
        { required: true, message: '请输入题目标题', trigger: 'blur' },
        { min: 5, message: '题目标题至少5个字符', trigger: 'blur' }
      ],
      content: [
        { required: true, message: '请输入题目内容', trigger: 'blur' }
      ],
      type: [
        { required: true, message: '请选择题目类型', trigger: 'change' }
      ],
      category_id: [
        { required: true, message: '请选择题目分类', trigger: 'change' }
      ],
      score: [
        { required: true, message: '请设置题目分值', trigger: 'blur' }
      ]
    }
    
    // 方法
    const handleModeChange = (mode) => {
      if (mode === 'template') {
        loadTemplates()
      }
    }
    
    const handleTypeChange = (type) => {
      if (type === 'boolean') {
        questionForm.options = ['正确', '错误']
        questionForm.correct_answer = ''
      } else if (['fill', 'essay', 'coding'].includes(type)) {
        questionForm.options = []
        questionForm.correct_answer = ''
      } else if (type === 'multiple') {
        questionForm.options = ['', '']
        questionForm.correct_answer = []
      } else {
        questionForm.options = ['', '']
        questionForm.correct_answer = ''
      }
    }
    
    const getOptionLabel = (index) => {
      return String.fromCharCode(65 + index)
    }
    
    const getMinOptions = () => {
      return questionForm.type === 'boolean' ? 2 : 2
    }
    
    const addOption = () => {
      if (questionForm.options.length < 10) {
        questionForm.options.push('')
      }
    }
    
    const removeOption = (index) => {
      if (questionForm.options.length > getMinOptions()) {
        questionForm.options.splice(index, 1)
        // 调整正确答案
        if (questionForm.type === 'single' && questionForm.correct_answer === index) {
          questionForm.correct_answer = ''
        } else if (questionForm.type === 'multiple') {
          const answerIndex = questionForm.correct_answer.indexOf(index)
          if (answerIndex > -1) {
            questionForm.correct_answer.splice(answerIndex, 1)
          }
          questionForm.correct_answer = questionForm.correct_answer.map(ans => 
            ans > index ? ans - 1 : ans
          )
        }
      }
    }
    
    // 文件上传处理
    const handleImageSuccess = (response) => {
      questionForm.imageUrl = response.data.url
      questionForm.images.push(response.data)
      ElMessage.success('图片上传成功')
    }
    
    const beforeImageUpload = (file) => {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5
      
      if (!isImage) {
        ElMessage.error('只能上传图片文件!')
        return false
      }
      if (!isLt5M) {
        ElMessage.error('图片大小不能超过5MB!')
        return false
      }
      return true
    }
    
    const handleAttachmentSuccess = (response, file, fileList) => {
      questionForm.attachments = fileList.map(f => ({
        name: f.name,
        url: f.response?.data?.url || f.url
      }))
      ElMessage.success('附件上传成功')
    }
    
    const handleAttachmentRemove = (file, fileList) => {
      questionForm.attachments = fileList.map(f => ({
        name: f.name,
        url: f.response?.data?.url || f.url
      }))
    }
    
    // 表单提交
    const submitForm = () => {
      questionFormRef.value.validate((valid) => {
        if (valid) {
          submitting.value = true
          createQuestion(questionForm).then(() => {
            submitting.value = false
            ElMessage.success('题目创建成功')
            router.push('/questions/list')
          }).catch(() => {
            submitting.value = false
          })
        }
      })
    }
    
    const resetForm = () => {
      ElMessageBox.confirm('确定要重置表单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        questionFormRef.value.resetFields()
        Object.assign(questionForm, {
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
          time_limit: 0,
          status: 1,
          images: [],
          attachments: [],
          imageUrl: ''
        })
        ElMessage.success('表单已重置')
      })
    }
    
    const saveDraft = () => {
      // 保存草稿逻辑
      ElMessage.success('草稿保存成功')
    }
    
    const previewQuestion = () => {
      previewVisible.value = true
    }
    
    const saveAsTemplate = () => {
      saveTemplateVisible.value = true
    }
    
    const handleTemplateSaved = () => {
      ElMessage.success('模板保存成功')
    }
    
    // 批量创建相关
    const addBatchQuestion = () => {
      batchQuestions.value.push({
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
      activeQuestions.value.push(batchQuestions.value.length - 1)
    }
    
    const removeBatchQuestion = (index) => {
      batchQuestions.value.splice(index, 1)
      activeQuestions.value = activeQuestions.value.filter(i => i !== index)
    }
    
    const clearBatchQuestions = () => {
      ElMessageBox.confirm('确定要清空所有题目吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        batchQuestions.value = []
        activeQuestions.value = []
      })
    }
    
    const submitBatchQuestions = () => {
      if (batchQuestions.value.length === 0) {
        ElMessage.warning('请至少添加一道题目')
        return
      }
      
      batchSubmitting.value = true
      createBatchQuestions({ questions: batchQuestions.value }).then((response) => {
        batchSubmitting.value = false
        const { success, failed } = response.data
        ElMessage.success(`批量创建完成：成功${success}道，失败${failed}道`)
        if (failed === 0) {
          router.push('/questions/list')
        }
      }).catch(() => {
        batchSubmitting.value = false
      })
    }
    
    // Excel导入相关
    const downloadTemplate = () => {
      // 下载Excel模板
      const link = document.createElement('a')
      link.href = '/templates/question-import-template.xlsx'
      link.download = '题目导入模板.xlsx'
      link.click()
      importStep.value = 1
    }
    
    const beforeImportUpload = (file) => {
      const isExcel = file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      const isLt10M = file.size / 1024 / 1024 < 10
      
      if (!isExcel) {
        ElMessage.error('只能上传Excel文件!')
        return false
      }
      if (!isLt10M) {
        ElMessage.error('文件大小不能超过10MB!')
        return false
      }
      return true
    }
    
    const handleImportSuccess = (response) => {
      importResult.value = response.data
      importStep.value = 2
    }
    
    const handleImportError = () => {
      ElMessage.error('文件上传失败，请重试')
    }
    
    const confirmImport = () => {
      importStep.value = 3
      ElMessage.success('题目导入成功')
      setTimeout(() => {
        router.push('/questions/list')
      }, 2000)
    }
    
    // 模板相关
    const loadTemplates = async () => {
      try {
        const response = await fetchQuestionTemplates()
        templates.value = response.data.items
      } catch (error) {
        ElMessage.error('加载模板失败')
      }
    }
    
    const selectTemplate = (template) => {
      selectedTemplate.value = template
      Object.assign(templateCustomData, JSON.parse(template.template_data))
    }
    
    const createFromTemplate = () => {
      if (!selectedTemplate.value) {
        ElMessage.warning('请选择一个模板')
        return
      }
      
      templateSubmitting.value = true
      createFromTemplate(selectedTemplate.value.id, { customData: templateCustomData }).then(() => {
        templateSubmitting.value = false
        ElMessage.success('从模板创建成功')
        router.push('/questions/list')
      }).catch(() => {
        templateSubmitting.value = false
      })
    }
    
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }
    
    // 加载分类数据
    const loadCategories = async () => {
      try {
        const response = await fetchQuestionCategories()
        categories.value = response.data.items
      } catch (error) {
        ElMessage.error('加载分类失败')
      }
    }
    
    onMounted(() => {
      loadCategories()
    })
    
    return {
      // 响应式数据
      createMode,
      editorMode,
      questionForm,
      batchQuestions,
      activeQuestions,
      batchSubmitting,
      importStep,
      importResult,
      templates,
      selectedTemplate,
      templateSearch,
      templateCustomData,
      templateSubmitting,
      submitting,
      previewVisible,
      saveTemplateVisible,
      categories,
      knowledgePoints,
      commonTags,
      
      // 计算属性
      needOptions,
      filteredTemplates,
      uploadHeaders,
      
      // 表单相关
      questionFormRef,
      editorRef,
      rules,
      
      // 方法
      handleModeChange,
      handleTypeChange,
      getOptionLabel,
      getMinOptions,
      addOption,
      removeOption,
      handleImageSuccess,
      beforeImageUpload,
      handleAttachmentSuccess,
      handleAttachmentRemove,
      submitForm,
      resetForm,
      saveDraft,
      previewQuestion,
      saveAsTemplate,
      handleTemplateSaved,
      addBatchQuestion,
      removeBatchQuestion,
      clearBatchQuestions,
      submitBatchQuestions,
      downloadTemplate,
      beforeImportUpload,
      handleImportSuccess,
      handleImportError,
      confirmImport,
      loadTemplates,
      selectTemplate,
      createFromTemplate,
      formatDate,
      
      // 图标
      Plus,
      UploadFilled
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.create-container {
  max-width: 1200px;
  margin: 0 auto;
}

.mode-selector {
  margin-bottom: 20px;
  text-align: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-form {
  padding: 20px 0;
}

.content-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.rich-editor {
  min-height: 200px;
  padding: 10px;
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

.image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: .3s;
}

.image-uploader:hover {
  border-color: #409EFF;
}

.image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.image {
  width: 178px;
  height: 178px;
  display: block;
}

/* 批量创建样式 */
.batch-create {
  padding: 20px 0;
}

.batch-toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.batch-questions {
  max-height: 600px;
  overflow-y: auto;
}

/* 导入样式 */
.import-section {
  padding: 20px 0;
}

.step-content {
  margin-top: 30px;
  min-height: 300px;
}

.import-result {
  text-align: center;
}

.import-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

/* 模板样式 */
.template-section {
  padding: 20px 0;
}

.template-list {
  max-height: 500px;
  overflow-y: auto;
}

.template-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.template-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.template-item.active {
  border-color: #409EFF;
  background-color: #f0f9ff;
}

.template-item h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.template-item p {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
}

.template-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-time {
  font-size: 12px;
  color: #909399;
}

.template-preview {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.template-preview pre {
  margin: 0;
  font-size: 12px;
  color: #606266;
}
</style>