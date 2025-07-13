<template>
  <div class="login-logs">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>登录日志</span>
          <el-button type="primary" @click="refreshLogs">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <!-- 筛选条件 -->
      <div class="filter-container">
        <el-form :inline="true" :model="listQuery" class="demo-form-inline">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="handleDateChange"
            />
          </el-form-item>
          <el-form-item label="登录状态">
            <el-select v-model="listQuery.status" placeholder="请选择" clearable>
              <el-option label="全部" value="" />
              <el-option label="成功" value="1" />
              <el-option label="失败" value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="IP地址">
            <el-input
              v-model="listQuery.ip"
              placeholder="请输入IP地址"
              clearable
              style="width: 200px;"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetFilter">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 登录日志表格 -->
      <el-table
        v-loading="listLoading"
        :data="list"
        element-loading-text="加载中"
        border
        fit
        highlight-current-row
        style="width: 100%"
      >
        <el-table-column align="center" label="序号" width="80">
          <template #default="{ $index }">
            {{ (listQuery.page - 1) * listQuery.limit + $index + 1 }}
          </template>
        </el-table-column>
        
        <el-table-column label="登录时间" width="180" align="center">
          <template #default="{ row }">
            <span>{{ formatDate(row.loginTime) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="IP地址" width="150" align="center">
          <template #default="{ row }">
            <span>{{ row.ip }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="地理位置" width="200" align="center">
          <template #default="{ row }">
            <span>{{ row.location || '未知' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="设备信息" min-width="250" align="center">
          <template #default="{ row }">
            <el-tooltip :content="row.userAgent" placement="top">
              <span class="device-info">{{ getDeviceInfo(row.userAgent) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        
        <el-table-column label="登录状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="失败原因" width="150" align="center">
          <template #default="{ row }">
            <span v-if="row.status === 0">{{ row.failReason || '未知' }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" align="center" width="120">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <pagination
        v-show="total > 0"
        v-model:page="listQuery.page"
        v-model:limit="listQuery.limit"
        :total="total"
        @pagination="getList"
      />
    </el-card>
    
    <!-- 详情对话框 -->
    <el-dialog title="登录详情" v-model="detailVisible" width="600px">
      <el-descriptions :column="1" border v-if="currentLog">
        <el-descriptions-item label="登录时间">
          {{ formatDate(currentLog.loginTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ currentLog.ip }}
        </el-descriptions-item>
        <el-descriptions-item label="地理位置">
          {{ currentLog.location || '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="登录状态">
          <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'">
            {{ currentLog.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="失败原因" v-if="currentLog.status === 0">
          {{ currentLog.failReason || '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="用户代理">
          <div class="user-agent">{{ currentLog.userAgent }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="会话ID">
          {{ currentLog.sessionId || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="登录方式">
          {{ getLoginType(currentLog.loginType) }}
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getLoginLogs } from '@/api/security'
import Pagination from '@/components/Pagination/index.vue'

export default {
  name: 'LoginLogs',
  components: {
    Refresh,
    Search,
    Pagination
  },
  setup() {
    const list = ref([])
    const total = ref(0)
    const listLoading = ref(false)
    const detailVisible = ref(false)
    const currentLog = ref(null)
    const dateRange = ref([])
    
    const listQuery = reactive({
      page: 1,
      limit: 20,
      status: '',
      ip: '',
      startTime: '',
      endTime: ''
    })
    
    const getList = () => {
      listLoading.value = true
      getLoginLogs(listQuery).then(response => {
        list.value = response.data.items || []
        total.value = response.data.total || 0
        listLoading.value = false
      }).catch(error => {
        listLoading.value = false
        ElMessage.error(error.message || '获取登录日志失败')
      })
    }
    
    const handleFilter = () => {
      listQuery.page = 1
      getList()
    }
    
    const resetFilter = () => {
      Object.assign(listQuery, {
        page: 1,
        limit: 20,
        status: '',
        ip: '',
        startTime: '',
        endTime: ''
      })
      dateRange.value = []
      getList()
    }
    
    const refreshLogs = () => {
      getList()
    }
    
    const handleDateChange = (dates) => {
      if (dates && dates.length === 2) {
        listQuery.startTime = dates[0]
        listQuery.endTime = dates[1]
      } else {
        listQuery.startTime = ''
        listQuery.endTime = ''
      }
    }
    
    const handleViewDetail = (row) => {
      currentLog.value = row
      detailVisible.value = true
    }
    
    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString()
    }
    
    const getDeviceInfo = (userAgent) => {
      if (!userAgent) return '未知设备'
      
      // 简单的设备信息解析
      if (userAgent.includes('Mobile')) {
        return '移动设备'
      } else if (userAgent.includes('Chrome')) {
        return 'Chrome 浏览器'
      } else if (userAgent.includes('Firefox')) {
        return 'Firefox 浏览器'
      } else if (userAgent.includes('Safari')) {
        return 'Safari 浏览器'
      } else if (userAgent.includes('Edge')) {
        return 'Edge 浏览器'
      } else {
        return '桌面设备'
      }
    }
    
    const getLoginType = (type) => {
      const types = {
        1: '用户名密码',
        2: '邮箱验证码',
        3: '手机验证码',
        4: '第三方登录'
      }
      return types[type] || '未知'
    }
    
    onMounted(() => {
      getList()
    })
    
    return {
      list,
      total,
      listLoading,
      detailVisible,
      currentLog,
      dateRange,
      listQuery,
      getList,
      handleFilter,
      resetFilter,
      refreshLogs,
      handleDateChange,
      handleViewDetail,
      formatDate,
      getDeviceInfo,
      getLoginType
    }
  }
}
</script>

<style lang="scss" scoped>
.login-logs {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-container {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.device-info {
  cursor: pointer;
  color: #409eff;
  
  &:hover {
    text-decoration: underline;
  }
}

.user-agent {
  word-break: break-all;
  line-height: 1.5;
  max-height: 100px;
  overflow-y: auto;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-table) {
  .el-table__row {
    &:hover {
      background-color: #f5f7fa;
    }
  }
}
</style>