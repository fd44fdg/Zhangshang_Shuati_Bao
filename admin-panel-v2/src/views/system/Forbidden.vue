<template>
  <div class="page">
    <n-result status="403" title="无访问权限" description="您没有访问该页面的权限">
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
