<template>
  <div class="page">
    <n-result status="404" title="页面不存在" description="您访问的页面走丢了">
      <template #footer>
        <n-button type="primary" @click="goHome">返回首页</n-button>
      </template>
    </n-result>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NResult, NButton } from 'naive-ui'
const router = useRouter()
function goHome(){ router.replace('/') }
</script>
<style scoped>
.page{ min-height: calc(100vh - 120px); display:flex; align-items:center; justify-content:center; padding:40px; }
</style>
