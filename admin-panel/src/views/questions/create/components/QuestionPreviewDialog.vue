<template>
  <el-dialog
    v-model="visible"
    title="题目预览"
    width="800px"
    :before-close="handleClose"
  >
    <div class="question-preview">
      <!-- 题目信息 -->
      <div class="question-header">
        <h2 class="question-title">{{ question.title || '未设置标题' }}</h2>
        <div class="question-meta">
          <el-tag :type="getDifficultyType(question.difficulty)" size="small">
            {{ getDifficultyLabel(question.difficulty) }}
          </el-tag>
          <el-tag type="info" size="small" v-if="question.score">
            {{ question.score }}分
          </el-tag>
          <el-tag type="warning" size="small" v-if="question.time_limit">
            {{ question.time_limit }}秒
          </el-tag>
          <el-tag size="small">
            {{ getTypeLabel(question.type) }}
          </el-tag>
        </div>
      </div>
      
      <!-- 题目内容 -->
      <div class="question-content">
        <div class="content-text" v-html="formatContent(question.content)"></div>
        
        <!-- 题目图片 -->
        <div v-if="question.imageUrl" class="question-image">
          <img :src="question.imageUrl" alt="题目图片" />
        </div>
      </div>
      
      <!-- 选项 -->
      <div v-if="needOptions" class="question-options">
        <h4>选项：</h4>
        <div class="options-list">
          <div
            v-for="(option, index) in validOptions"
            :key="index"
            class="option-item"
            :class="{ 
              'correct-single': question.type === 'single' && question.correct_answer === index,
              'correct-multiple': question.type === 'multiple' && question.correct_answer?.includes(index)
            }"
          >
            <span class="option-label">{{ getOptionLabel(index) }}.</span>
            <span class="option-text">{{ option }}</span>
            <el-icon v-if="isCorrectAnswer(index)" class="correct-icon" color="#67C23A">
              <Check />
            </el-icon>
          </div>
        </div>
      </div>
      
      <!-- 正确答案 -->
      <div class="correct-answer">
        <h4>正确答案：</h4>
        <div class="answer-content">
          <div v-if="question.type === 'single'">
            <el-tag type="success">
              {{ getOptionLabel(question.correct_answer) }}. {{ validOptions[question.correct_answer] }}
            </el-tag>
          </div>
          
          <div v-else-if="question.type === 'multiple'">
            <el-tag
              v-for="answerIndex in question.correct_answer"
              :key="answerIndex"
              type="success"
              style="margin-right: 8px; margin-bottom: 4px;"
            >
              {{ getOptionLabel(answerIndex) }}. {{ validOptions[answerIndex] }}
            </el-tag>
          </div>
          
          <div v-else-if="question.type === 'boolean'">
            <el-tag type="success">
              {{ question.correct_answer === 0 ? '正确' : '错误' }}
            </el-tag>
          </div>
          
          <div v-else-if="['fill', 'essay', 'coding'].includes(question.type)">
            <div class="answer-text">{{ question.correct_answer || '未设置答案' }}</div>
          </div>
        </div>
      </div>
      
      <!-- 题目解析 -->
      <div v-if="question.explanation" class="question-explanation">
        <h4>题目解析：</h4>
        <div class="explanation-content" v-html="formatContent(question.explanation)"></div>
      </div>
      
      <!-- 题目属性 -->
      <div class="question-attributes">
        <h4>题目属性：</h4>
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="题目类型">
            {{ getTypeLabel(question.type) }}
          </el-descriptions-item>
          <el-descriptions-item label="难度等级">
            <el-tag :type="getDifficultyType(question.difficulty)" size="small">
              {{ getDifficultyLabel(question.difficulty) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="题目分值">
            {{ question.score || 5 }}分
          </el-descriptions-item>
          <el-descriptions-item label="答题时限">
            {{ question.time_limit ? `${question.time_limit}秒` : '无限制' }}
          </el-descriptions-item>
          <el-descriptions-item label="题目分类">
            {{ getCategoryLabel(question.category_id) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="question.status === 1 ? 'success' : 'danger'" size="small">
              {{ question.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="知识点" :span="2">
            <el-tag
              v-for="point in question.knowledge_points"
              :key="point"
              size="small"
              style="margin-right: 4px;"
            >
              {{ point }}
            </el-tag>
            <span v-if="!question.knowledge_points?.length" class="text-muted">未设置</span>
          </el-descriptions-item>
          <el-descriptions-item label="标签" :span="2">
            <el-tag
              v-for="tag in question.tags"
              :key="tag"
              type="info"
              size="small"
              style="margin-right: 4px;"
            >
              {{ tag }}
            </el-tag>
            <span v-if="!question.tags?.length" class="text-muted">未设置</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <!-- 附件 -->
      <div v-if="question.attachments?.length" class="question-attachments">
        <h4>附件：</h4>
        <div class="attachments-list">
          <div
            v-for="(attachment, index) in question.attachments"
            :key="index"
            class="attachment-item"
          >
            <el-icon><Document /></el-icon>
            <span>{{ attachment.name }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleEdit">编辑题目</el-button>
        <el-button type="success" @click="handleSubmit">确认创建</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { computed, inject } from 'vue'
import { Check, Document } from '@element-plus/icons-vue'

export default {
  name: 'QuestionPreviewDialog',
  components: {
    Check,
    Document
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    question: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'edit', 'submit'],
  setup(props, { emit }) {
    const visible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })
    
    // 计算属性
    const needOptions = computed(() => {
      return ['single', 'multiple', 'boolean'].includes(props.question.type)
    })
    
    const validOptions = computed(() => {
      return props.question.options?.filter(option => option?.trim()) || []
    })
    
    // 方法
    const getTypeLabel = (type) => {
      const typeMap = {
        single: '单选题',
        multiple: '多选题',
        boolean: '判断题',
        fill: '填空题',
        essay: '简答题',
        coding: '编程题'
      }
      return typeMap[type] || '未知类型'
    }
    
    const getDifficultyType = (difficulty) => {
      const typeMap = {
        easy: 'success',
        medium: 'warning',
        hard: 'danger'
      }
      return typeMap[difficulty] || 'info'
    }
    
    const getDifficultyLabel = (difficulty) => {
      const labelMap = {
        easy: '简单',
        medium: '中等',
        hard: '困难'
      }
      return labelMap[difficulty] || '未设置'
    }
    
    const getCategoryLabel = (categoryId) => {
      // 这里应该从父组件或store获取分类数据
      return categoryId ? `分类${categoryId}` : '未设置'
    }
    
    const getOptionLabel = (index) => {
      return String.fromCharCode(65 + index)
    }
    
    const isCorrectAnswer = (index) => {
      if (props.question.type === 'single') {
        return props.question.correct_answer === index
      } else if (props.question.type === 'multiple') {
        return props.question.correct_answer?.includes(index)
      }
      return false
    }
    
    const formatContent = (content) => {
      if (!content) return ''
      // 简单的Markdown转HTML（可以使用更完整的Markdown解析器）
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
    }
    
    const handleClose = () => {
      visible.value = false
    }
    
    const handleEdit = () => {
      emit('edit')
      handleClose()
    }
    
    const handleSubmit = () => {
      emit('submit')
      handleClose()
    }
    
    return {
      visible,
      needOptions,
      validOptions,
      getTypeLabel,
      getDifficultyType,
      getDifficultyLabel,
      getCategoryLabel,
      getOptionLabel,
      isCorrectAnswer,
      formatContent,
      handleClose,
      handleEdit,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.question-preview {
  padding: 20px 0;
}

.question-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.question-title {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.question-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.question-content {
  margin-bottom: 20px;
}

.content-text {
  line-height: 1.6;
  color: #606266;
  font-size: 14px;
  margin-bottom: 15px;
}

.question-image {
  text-align: center;
  margin: 15px 0;
}

.question-image img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.question-options {
  margin-bottom: 20px;
}

.question-options h4,
.correct-answer h4,
.question-explanation h4,
.question-attributes h4,
.question-attachments h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.options-list {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
  position: relative;
}

.option-item:last-child {
  border-bottom: none;
}

.option-item.correct-single,
.option-item.correct-multiple {
  background-color: #f0f9ff;
  border-radius: 4px;
  padding: 8px 12px;
  margin: 4px 0;
  border: 1px solid #b3d8ff;
}

.option-label {
  font-weight: bold;
  margin-right: 8px;
  color: #606266;
  min-width: 25px;
}

.option-text {
  flex: 1;
  color: #303133;
}

.correct-icon {
  margin-left: 8px;
}

.correct-answer {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f0f9ff;
  border-radius: 4px;
  border-left: 4px solid #409EFF;
}

.answer-content {
  margin-top: 8px;
}

.answer-text {
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  color: #303133;
  line-height: 1.5;
}

.question-explanation {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fdf6ec;
  border-radius: 4px;
  border-left: 4px solid #E6A23C;
}

.explanation-content {
  color: #606266;
  line-height: 1.6;
  margin-top: 8px;
}

.question-attributes {
  margin-bottom: 20px;
}

.question-attachments {
  margin-bottom: 20px;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.text-muted {
  color: #909399;
  font-style: italic;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  color: #606266;
}

:deep(.el-descriptions__content) {
  color: #303133;
}
</style>