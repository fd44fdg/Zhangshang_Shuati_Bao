<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <span>系统配置</span>
      </template>
      <el-form v-if="settingsForm" :model="settingsForm" label-width="120px" style="max-width: 600px; margin-top: 20px;">
        <el-form-item label="系统名称" prop="systemName">
          <el-input v-model="settingsForm.systemName" placeholder="请输入系统名称" />
        </el-form-item>
        <el-form-item label="系统描述" prop="systemDescription">
          <el-input v-model="settingsForm.systemDescription" type="textarea" :rows="3" placeholder="请输入系统描述" />
        </el-form-item>
        <el-form-item label="系统版本" prop="systemVersion">
          <el-input v-model="settingsForm.systemVersion" placeholder="请输入系统版本" />
        </el-form-item>
        <el-form-item label="维护模式" prop="maintenanceMode">
          <el-switch v-model="settingsForm.maintenanceMode" />
          <el-tooltip content="开启后，普通用户将无法访问小程序" placement="top">
            <el-icon style="margin-left: 8px; color: #909399;"><QuestionFilled /></el-icon>
          </el-tooltip>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="saveSettings">保存配置</el-button>
          <el-button @click="resetSettings">重置</el-button>
        </el-form-item>
      </el-form>
       <el-skeleton v-else :rows="5" animated />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElNotification } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import { fetchSettings, updateSettings } from '@/api/system'

const settingsForm = ref(null)
const originalSettings = ref(null)
const loading = ref(false)

const getSettings = async () => {
  loading.value = true
  try {
    const { data } = await fetchSettings()
    settingsForm.value = data
    originalSettings.value = JSON.parse(JSON.stringify(data))
  } catch (error) {
    ElNotification({ title: '错误', message: '获取配置失败', type: 'error' })
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  loading.value = true
  try {
    await updateSettings(settingsForm.value)
    ElNotification({ title: '成功', message: '配置保存成功', type: 'success' })
    await getSettings() // 重新获取以同步最新状态
  } catch (error) {
    ElNotification({ title: '错误', message: '保存配置失败', type: 'error' })
  } finally {
    loading.value = false
  }
}

const resetSettings = () => {
  if (originalSettings.value) {
    settingsForm.value = JSON.parse(JSON.stringify(originalSettings.value))
    ElNotification({ title: '提示', message: '配置已重置为上次保存的状态', type: 'info' })
  }
}

onMounted(() => {
  getSettings()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}
</style>