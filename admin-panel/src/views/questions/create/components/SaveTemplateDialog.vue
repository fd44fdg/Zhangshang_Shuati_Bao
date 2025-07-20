<template>
  <el-dialog
    v-model="visible"
    title="保存为模板"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="templateFormRef"
      :model="templateForm"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="模板名称" prop="name">
        <el-input
          v-model="templateForm.name"
          placeholder="请输入模板名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="模板描述" prop="description">
        <el-input
          v-model="templateForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入模板描述"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="模板分类" prop="category">
        <el-select
          v-model="templateForm.category"
          placeholder="请选择模板分类"
          style="width: 100%"
        >
          <el-option label="单选题模板" value="single" />
          <el-option label="多选题模板" value="multiple" />
          <el-option label="判断题模板" value="boolean" />
          <el-option label="填空题模板" value="fill" />
          <el-option label="简答题模板" value="essay" />
          <el-option label="编程题模板" value="coding" />
          <el-option label="综合模板" value="mixed" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="可见性" prop="visibility">
        <el-radio-group v-model="templateForm.visibility">
          <el-radio :label="1">公开（所有用户可见）</el-radio>
          <el-radio :label="0">私有（仅自己可见）</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="templateForm.tags"
          multiple
          filterable
          allow-create
          placeholder="请输入标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in commonTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>
      
      <!-- 模板数据预览 -->
      <el-form-item label="模板内容">
        <el-collapse v-model="activePreview">
          <el-collapse-item title="查看模板数据" name="preview">
            <div class="template-preview">
              <h4>将保存的数据字段：</h4>
              <ul class="field-list">
                <li v-for="field in templateFields" :key="field.key" class="field-item">
                  <span class="field-name">{{ field.name }}:</span>
                  <span class="field-value">{{ getFieldValue(field.key) }}</span>
                </li>
              </ul>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ saving ? '保存中...' : '保存模板' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createQuestionTemplate } from '@/api/question'

export default {
  name: 'SaveTemplateDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    questionData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const templateFormRef = ref(null)
    const saving = ref(false)
    const activePreview = ref([])
    
    const visible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })
    
    const templateForm = reactive({
      name: '',
      description: '',
      category: '',
      visibility: 1,
      tags: []
    })
    
    const commonTags = ref([
      '基础模板', '进阶模板', '实战模板', '面试模板',
      '前端', '后端', '数据库', '算法', '网络',
      '单选', '多选', '判断', '填空', '简答', '编程'
    ])
    
    // 模板字段定义
    const templateFields = ref([
      { key: 'type', name: '题目类型' },
      { key: 'difficulty', name: '难度等级' },
      { key: 'score', name: '默认分值' },
      { key: 'time_limit', name: '答题时限' },
      { key: 'options', name: '选项模板' },
      { key: 'knowledge_points', name: '知识点' },
      { key: 'tags', name: '标签' },
      { key: 'explanation', name: '解析模板' }
    ])
    
    const rules = {
      name: [
        { required: true, message: '请输入模板名称', trigger: 'blur' },
        { min: 2, max: 100, message: '模板名称长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      description: [
        { required: true, message: '请输入模板描述', trigger: 'blur' },
        { min: 10, max: 500, message: '模板描述长度在 10 到 500 个字符', trigger: 'blur' }
      ],
      category: [
        { required: true, message: '请选择模板分类', trigger: 'change' }
      ]
    }
    
    // 监听题目数据变化，自动填充模板信息
    watch(() => props.questionData, (newData) => {
      if (newData && Object.keys(newData).length > 0) {
        // 根据题目类型自动设置模板分类
        if (newData.type) {
          templateForm.category = newData.type
        }
        
        // 自动生成模板名称
        const typeMap = {
          single: '单选题',
          multiple: '多选题',
          boolean: '判断题',
          fill: '填空题',
          essay: '简答题',
          coding: '编程题'
        }
        
        const difficultyMap = {
          easy: '简单',
          medium: '中等',
          hard: '困难'
        }
        
        const typeName = typeMap[newData.type] || '题目'
        const difficultyName = difficultyMap[newData.difficulty] || ''
        const timestamp = new Date().toLocaleDateString()
        
        templateForm.name = `${typeName}${difficultyName}模板_${timestamp}`
        templateForm.description = `基于${typeName}创建的模板，包含${difficultyName}难度设置和相关配置`
        
        // 继承题目的标签
        if (newData.tags && newData.tags.length > 0) {
          templateForm.tags = [...newData.tags, '模板']
        } else {
          templateForm.tags = ['模板']
        }
      }
    }, { immediate: true, deep: true })
    
    const getFieldValue = (fieldKey) => {
      const value = props.questionData[fieldKey]
      
      if (value === undefined || value === null) {
        return '未设置'
      }
      
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : '未设置'
      }
      
      if (typeof value === 'boolean') {
        return value ? '是' : '否'
      }
      
      if (typeof value === 'number') {
        return value.toString()
      }
      
      if (typeof value === 'string') {
        return value.trim() || '未设置'
      }
      
      return JSON.stringify(value)
    }
    
    const handleClose = () => {
      visible.value = false
      resetForm()
    }
    
    const resetForm = () => {
      templateFormRef.value?.resetFields()
      Object.assign(templateForm, {
        name: '',
        description: '',
        category: '',
        visibility: 1,
        tags: []
      })
    }
    
    const handleSave = () => {
      templateFormRef.value.validate((valid) => {
        if (valid) {
          saving.value = true
          
          // 构建模板数据
          const templateData = {
            type: props.questionData.type,
            difficulty: props.questionData.difficulty,
            score: props.questionData.score,
            time_limit: props.questionData.time_limit,
            knowledge_points: props.questionData.knowledge_points,
            tags: props.questionData.tags,
            explanation: props.questionData.explanation
          }
          
          // 如果是选择题，保存选项模板
          if (['single', 'multiple', 'boolean'].includes(props.questionData.type)) {
            templateData.options = props.questionData.options
          }
          
          const saveData = {
            name: templateForm.name,
            description: templateForm.description,
            category: templateForm.category,
            visibility: templateForm.visibility,
            tags: templateForm.tags,
            template_data: JSON.stringify(templateData)
          }
          
          createQuestionTemplate(saveData).then(() => {
            saving.value = false
            ElMessage.success('模板保存成功')
            emit('saved')
            handleClose()
          }).catch((error) => {
            saving.value = false
            ElMessage.error('模板保存失败：' + (error.message || '未知错误'))
          })
        } else {
          ElMessage.warning('请完善模板信息')
        }
      })
    }
    
    return {
      visible,
      templateForm,
      templateFormRef,
      saving,
      activePreview,
      commonTags,
      templateFields,
      rules,
      getFieldValue,
      handleClose,
      handleSave
    }
  }
}
</script>

<style scoped>
.template-preview {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
}

.template-preview h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.field-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.field-item {
  display: flex;
  padding: 6px 0;
  border-bottom: 1px solid #ebeef5;
}

.field-item:last-child {
  border-bottom: none;
}

.field-name {
  font-weight: 600;
  color: #606266;
  min-width: 100px;
  margin-right: 10px;
}

.field-value {
  color: #303133;
  flex: 1;
  word-break: break-all;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-collapse-item__header) {
  font-size: 14px;
  color: #606266;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 10px;
}
</style>