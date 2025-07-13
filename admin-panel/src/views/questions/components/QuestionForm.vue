<template>
  <el-dialog :title="title" v-model="visible" width="800px" :close-on-click-modal="false" @close="onClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="题目分类" prop="categoryId">
        <el-select v-model="form.categoryId" placeholder="请选择题目分类">
          <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="题目类型" prop="type">
        <el-radio-group v-model="form.type" :disabled="isEdit">
          <el-radio label="single">单选题</el-radio>
          <el-radio label="multiple">多选题</el-radio>
          <el-radio label="boolean">判断题</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="题目内容" prop="title">
        <el-input v-model="form.title" type="textarea" :rows="3" placeholder="请输入题目内容" />
      </el-form-item>

      <!-- 动态选项 -->
      <template v-if="form.type === 'single' || form.type === 'multiple'">
        <el-form-item
          v-for="(option, index) in form.options"
          :key="index"
          :label="`选项 ${String.fromCharCode(65 + index)}`"
          :prop="`options.${index}.text`"
          :rules="{ required: true, message: '选项内容不能为空', trigger: 'blur' }"
        >
          <el-input v-model="option.text" style="width: 85%; margin-right: 10px;" />
          <el-button @click="removeOption(index)" :icon="Delete" circle />
        </el-form-item>
        <el-form-item>
          <el-button @click="addOption" :icon="Plus">添加选项</el-button>
        </el-form-item>
      </template>

      <!-- 正确答案 -->
      <el-form-item label="正确答案" prop="correctAnswer">
        <el-radio-group v-if="form.type === 'single'" v-model="form.correctAnswer[0]">
          <el-radio v-for="(option, index) in form.options" :key="index" :label="index">{{ String.fromCharCode(65 + index) }}</el-radio>
        </el-radio-group>
        <el-checkbox-group v-if="form.type === 'multiple'" v-model="form.correctAnswer">
          <el-checkbox v-for="(option, index) in form.options" :key="index" :label="index">{{ String.fromCharCode(65 + index) }}</el-checkbox>
        </el-checkbox-group>
        <el-radio-group v-if="form.type === 'boolean'" v-model="form.correctAnswer[0]">
          <el-radio :label="true">正确</el-radio>
          <el-radio :label="false">错误</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="题目解析" prop="explanation">
        <el-input v-model="form.explanation" type="textarea" :rows="3" placeholder="请输入题目解析" />
      </el-form-item>
      <el-form-item label="难度" prop="difficulty">
        <el-rate v-model="form.difficulty" :max="3" :texts="['简单', '中等', '困难']" show-text />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="loading">提交</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { createQuestion, updateQuestion, fetchQuestion, fetchQuestionCategories } from '@/api/question'
import { ElNotification } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  questionId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(props.modelValue)
const loading = ref(false)
const formRef = ref(null)
const categories = ref([])

const defaultForm = () => ({
  id: null,
  categoryId: '',
  type: 'single',
  title: '',
  options: [{ text: '' }, { text: '' }],
  correctAnswer: [],
  explanation: '',
  difficulty: 1
})

const form = ref(defaultForm())

const isEdit = computed(() => !!props.questionId)
const title = computed(() => (isEdit.value ? '编辑题目' : '创建题目'))

const rules = {
  categoryId: [{ required: true, message: '请选择题目分类', trigger: 'change' }],
  type: [{ required: true, message: '请选择题目类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  correctAnswer: [{ required: true, message: '请选择正确答案', trigger: 'change' }]
}

const addOption = () => {
  form.value.options.push({ text: '' })
}

const removeOption = (index) => {
  form.value.options.splice(index, 1)
}

const loadCategories = async () => {
  try {
    const res = await fetchQuestionCategories()
    categories.value = res.data.items
  } catch (error) {
    ElNotification({ title: '错误', message: '加载分类失败', type: 'error' })
  }
}

// Data transformation is tricky. This is a simplified example.
const transformToFormData = (data) => {
    return {
        id: data.id,
        categoryId: data.category_id,
        type: data.type,
        title: data.title,
        options: data.options.map(o => ({text: o})), // Assuming options are strings
        correctAnswer: data.correct_answer, // Assuming backend provides answer indexes
        explanation: data.explanation,
        difficulty: data.difficulty,
    }
}

const loadQuestionData = async (id) => {
    loading.value = true
    try {
        const res = await fetchQuestion(id)
        form.value = transformToFormData(res.data)
    } catch(e) {
        ElNotification({ title: '错误', message: '加载题目详情失败', type: 'error' })
    } finally {
        loading.value = false
    }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // Transform data back for the backend
        const payload = {
            ...form.value,
            category_id: form.value.categoryId,
            options: form.value.options.map(o => o.text),
            correct_answer: form.value.correctAnswer
        }
        if (isEdit.value) {
          await updateQuestion(props.questionId, payload)
        } else {
          await createQuestion(payload)
        }
        ElNotification({ title: '成功', message: '操作成功', type: 'success' })
        emit('success')
        visible.value = false
      } catch (error) {
        ElNotification({ title: '失败', message: error.message || '操作失败', type: 'error' })
      } finally {
        loading.value = false
      }
    }
  })
}

const onClose = () => {
  form.value = defaultForm()
  formRef.value?.clearValidate()
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      loadCategories()
      if (isEdit.value) {
        loadQuestionData(props.questionId)
      }
    }
  }
)

watch(
  () => form.value.type,
  (newType) => {
    form.value.correctAnswer = []
    if (newType === 'boolean') {
      form.value.options = [{ text: '正确' }, { text: '错误' }]
    }
  }
)
</script>

<style scoped>
.dialog-footer {
  padding-top: 20px;
  text-align: right;
}
</style>