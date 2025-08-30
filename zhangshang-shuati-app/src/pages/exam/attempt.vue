
<template>
  <view class="attempt-container">
    <!-- Header: Timer and Progress -->
    <view class="attempt-header">
      <view class="timer">⏱️ {{ formattedTime }}</view>
      <view class="progress">{{ currentQuestionIndex + 1 }} / {{ questions.length }}</view>
    </view>

    <!-- Question Display -->
    <view class="question-card">
      <view class="question-title">({{ questionType }}) {{ currentQuestion.title }}</view>
      <view v-if="currentQuestion.content" class="question-content">{{ currentQuestion.content }}</view>
      
      <!-- Answer Options -->
      <view class="options-container">
        <view v-if="currentQuestion.type === 'single'">
          <radio-group @change="handleSingleChange">
            <label v-for="(option, index) in currentQuestion.answers" :key="option.id" class="option-label">
              <view class="option-item">
                <radio :value="String(option.id)" :checked="isOptionChecked(option.id)" />
                <text>{{ option.text }}</text>
              </view>
            </label>
          </radio-group>
        </view>
        <view v-else-if="currentQuestion.type === 'multiple'">
          <checkbox-group @change="handleMultiChange">
            <label v-for="(option, index) in currentQuestion.answers" :key="option.id" class="option-label">
              <view class="option-item">
                <checkbox :value="String(option.id)" :checked="isOptionChecked(option.id)" />
                <text>{{ option.text }}</text>
              </view>
            </label>
          </checkbox-group>
        </view>
      </view>
    </view>

    <!-- Footer: Navigation and Submission -->
    <view class="attempt-footer">
      <button @click="prevQuestion" :disabled="currentQuestionIndex === 0">上一题</button>
      <button @click="nextQuestion" :disabled="currentQuestionIndex === questions.length - 1">下一题</button>
      <button @click="confirmSubmit" class="submit-btn">交卷</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { submitExam } from '@/api/exam'

const attemptId = ref(null)
const questions = ref([])
const duration = ref(0)
const currentQuestionIndex = ref(0)
const userAnswers = ref({}) // { questionId: [answerId1, answerId2], ... }

const timer = ref(null)
const remainingTime = ref(0)

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || { answers: [] })
const questionType = computed(() => {
    const typeMap = { single: '单选', multiple: '多选', essay: '问答' };
    return typeMap[currentQuestion.value.type] || '未知';
});

const formattedTime = computed(() => {
  const minutes = Math.floor(remainingTime.value / 60)
  const seconds = remainingTime.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

onLoad((options) => {
  if (options.attemptData) {
    const data = JSON.parse(decodeURIComponent(options.attemptData))
    attemptId.value = data.attempt_id
    questions.value = data.questions
    duration.value = data.duration
    remainingTime.value = data.duration * 60
    uni.setNavigationBarTitle({ title: data.exam_title })
    startTimer()
  }
})

onUnmounted(() => {
  clearInterval(timer.value)
})

const startTimer = () => {
  timer.value = setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      clearInterval(timer.value)
      handleSubmit()
    }
  }, 1000)
}

const handleSingleChange = (e) => {
  userAnswers.value[currentQuestion.value.id] = [e.detail.value]
}

const handleMultiChange = (e) => {
  userAnswers.value[currentQuestion.value.id] = e.detail.value
}

const isOptionChecked = (optionId) => {
    const answers = userAnswers.value[currentQuestion.value.id];
    return answers && answers.includes(String(optionId));
}

const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++
  }
}

const confirmSubmit = () => {
  uni.showModal({
    title: '确认交卷',
    content: '你确定要提交试卷吗？',
    success: (res) => {
      if (res.confirm) {
        handleSubmit()
      }
    }
  })
}

const handleSubmit = async () => {
  clearInterval(timer.value)
  uni.showLoading({ title: '正在提交...' })
  try {
    const res = await submitExam(attemptId.value, userAnswers.value)
    if (res.success) {
      uni.hideLoading()
      uni.redirectTo({
        url: `/pages/exam/report?attemptId=${attemptId.value}`
      })
    } else {
        throw new Error(res.message || '提交失败')
    }
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: error.message || '提交失败', icon: 'none' })
  }
}

</script>

<style scoped>
.attempt-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.attempt-header {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.question-card {
  flex-grow: 1;
  padding: 15px;
}
.question-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
}
.options-container {
    margin-top: 20px;
}
.option-label {
    display: block;
    margin-bottom: 10px;
}
.option-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 5px;
}
.attempt-footer {
  display: flex;
  justify-content: space-around;
  padding: 10px;
  border-top: 1px solid #eee;
}
.submit-btn {
    background-color: #007aff;
    color: white;
}
</style>
