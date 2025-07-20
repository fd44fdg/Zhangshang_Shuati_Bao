<template>
  <div class="app-container">
    <div class="stats-header">
      <h2>用户统计分析</h2>
      <div class="date-filter">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateChange"
        />
        <el-button type="primary" @click="refreshData" :loading="loading">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 概览统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon user-icon">
            <i class="el-icon-user"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ overviewStats.total_users }}</div>
            <div class="stat-label">总用户数</div>
            <div class="stat-change positive">+{{ overviewStats.new_users_today }} 今日新增</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon active-icon">
            <i class="el-icon-s-custom"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ overviewStats.active_users }}</div>
            <div class="stat-label">活跃用户</div>
            <div class="stat-change positive">+{{ overviewStats.active_growth }}% 较昨日</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon answer-icon">
            <i class="el-icon-edit"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ overviewStats.total_answers }}</div>
            <div class="stat-label">总答题数</div>
            <div class="stat-change positive">+{{ overviewStats.answers_today }} 今日</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon accuracy-icon">
            <i class="el-icon-trophy"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ overviewStats.avg_accuracy }}%</div>
            <div class="stat-label">平均正确率</div>
            <div class="stat-change positive">+{{ overviewStats.accuracy_growth }}% 较昨日</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用户注册趋势</span>
              <el-button type="text" @click="exportChart('registration')">导出</el-button>
            </div>
          </template>
          <div class="chart-container" id="registrationChart">
            <div class="chart-placeholder">
              <p>用户注册趋势图</p>
              <p>（此处可集成 ECharts）</p>
              <div class="mock-chart-data">
                <div v-for="(item, index) in registrationData" :key="index" class="chart-bar">
                  <div class="bar" :style="{ height: item.value * 2 + 'px' }"></div>
                  <div class="bar-label">{{ item.date }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用户活跃度</span>
              <el-button type="text" @click="exportChart('activity')">导出</el-button>
            </div>
          </template>
          <div class="chart-container" id="activityChart">
            <div class="chart-placeholder">
              <p>用户活跃度图</p>
              <p>（此处可集成 ECharts）</p>
              <div class="activity-stats">
                <div class="activity-item">
                  <span class="activity-label">日活跃用户:</span>
                  <span class="activity-value">{{ activityStats.daily }}</span>
                </div>
                <div class="activity-item">
                  <span class="activity-label">周活跃用户:</span>
                  <span class="activity-value">{{ activityStats.weekly }}</span>
                </div>
                <div class="activity-item">
                  <span class="activity-label">月活跃用户:</span>
                  <span class="activity-value">{{ activityStats.monthly }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-section">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>答题统计</span>
              <el-button type="text" @click="exportChart('answers')">导出</el-button>
            </div>
          </template>
          <div class="chart-container" id="answersChart">
            <div class="chart-placeholder">
              <p>答题统计图</p>
              <p>（此处可集成 ECharts）</p>
              <div class="answer-distribution">
                <div v-for="(item, index) in answerDistribution" :key="index" class="distribution-item">
                  <div class="distribution-label">{{ item.category }}</div>
                  <div class="distribution-bar">
                    <div class="bar-fill" :style="{ width: item.percentage + '%' }"></div>
                  </div>
                  <div class="distribution-value">{{ item.count }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用户分布</span>
              <el-button type="text" @click="exportChart('distribution')">导出</el-button>
            </div>
          </template>
          <div class="chart-container" id="distributionChart">
            <div class="chart-placeholder">
              <p>用户分布图</p>
              <p>（此处可集成 ECharts）</p>
              <div class="user-distribution">
                <div class="pie-chart-mock">
                  <div class="pie-slice slice-1">管理员 5%</div>
                  <div class="pie-slice slice-2">普通用户 95%</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细统计表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户详细统计</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="exportTable">导出表格</el-button>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="tableLoading"
        :data="userDetailStats"
        border
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="real_name" label="真实姓名" width="120" />
        <el-table-column prop="total_answers" label="总答题数" width="100" align="center" />
        <el-table-column prop="correct_answers" label="正确答题数" width="120" align="center" />
        <el-table-column label="正确率" width="100" align="center">
          <template #default="{row}">
            <span>{{ calculateAccuracy(row.total_answers, row.correct_answers) }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="study_days" label="学习天数" width="100" align="center" />
        <el-table-column prop="last_login" label="最后登录" width="150" align="center" />
        <el-table-column label="活跃度" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="getActivityType(row.activity_level)">
              {{ getActivityLabel(row.activity_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="150" align="center" />
      </el-table>
      
      <pagination
        v-show="detailTotal > 0"
        :total="detailTotal"
        v-model:page="detailQuery.page"
        v-model:limit="detailQuery.limit"
        @pagination="getDetailStats"
      />
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Pagination from '@/components/Pagination/index.vue'

export default {
  name: 'UserStats',
  components: { Pagination },
  setup() {
    const loading = ref(false)
    const tableLoading = ref(false)
    const dateRange = ref([])
    const detailTotal = ref(0)
    
    const detailQuery = reactive({
      page: 1,
      limit: 20
    })
    
    const overviewStats = reactive({
      total_users: 1248,
      new_users_today: 23,
      active_users: 856,
      active_growth: 12.5,
      total_answers: 15678,
      answers_today: 234,
      avg_accuracy: 78.5,
      accuracy_growth: 2.3
    })
    
    const activityStats = reactive({
      daily: 156,
      weekly: 432,
      monthly: 856
    })
    
    const registrationData = ref([
      { date: '01-10', value: 15 },
      { date: '01-11', value: 23 },
      { date: '01-12', value: 18 },
      { date: '01-13', value: 31 },
      { date: '01-14', value: 27 },
      { date: '01-15', value: 23 },
      { date: '01-16', value: 19 }
    ])
    
    const answerDistribution = ref([
      { category: '前端开发', count: 4567, percentage: 35 },
      { category: '后端开发', count: 3421, percentage: 26 },
      { category: '数据库', count: 2134, percentage: 16 },
      { category: '算法', count: 1876, percentage: 14 },
      { category: '其他', count: 1180, percentage: 9 }
    ])
    
    const userDetailStats = ref([
      {
        username: 'zhangsan',
        real_name: '张三',
        total_answers: 156,
        correct_answers: 134,
        study_days: 25,
        activity_level: 'high',
        last_login: '2024-01-15 10:20:00',
        created_at: '2024-01-10 09:15:00'
      },
      {
        username: 'lisi',
        real_name: '李四',
        total_answers: 89,
        correct_answers: 67,
        study_days: 18,
        activity_level: 'medium',
        last_login: '2024-01-14 16:45:00',
        created_at: '2024-01-08 14:30:00'
      },
      {
        username: 'wangwu',
        real_name: '王五',
        total_answers: 23,
        correct_answers: 15,
        study_days: 8,
        activity_level: 'low',
        last_login: '2024-01-12 08:30:00',
        created_at: '2024-01-05 11:20:00'
      }
    ])
    
    const calculateAccuracy = (total, correct) => {
      if (total === 0) return 0
      return Math.round((correct / total) * 100)
    }
    
    const getActivityType = (level) => {
      const typeMap = {
        high: 'success',
        medium: 'warning',
        low: 'danger'
      }
      return typeMap[level] || 'info'
    }
    
    const getActivityLabel = (level) => {
      const labelMap = {
        high: '高活跃',
        medium: '中活跃',
        low: '低活跃'
      }
      return labelMap[level] || '未知'
    }
    
    const handleDateChange = (dates) => {
      console.log('日期范围变更:', dates)
      refreshData()
    }
    
    const refreshData = () => {
      loading.value = true
      // 模拟数据刷新
      setTimeout(() => {
        // 随机更新一些数据
        overviewStats.new_users_today = Math.floor(Math.random() * 50) + 10
        overviewStats.answers_today = Math.floor(Math.random() * 300) + 100
        overviewStats.active_growth = (Math.random() * 20 - 5).toFixed(1)
        
        loading.value = false
        ElMessage.success('数据刷新成功')
      }, 1000)
    }
    
    const getDetailStats = () => {
      tableLoading.value = true
      setTimeout(() => {
        detailTotal.value = 156 // 模拟总数
        tableLoading.value = false
      }, 500)
    }
    
    const exportChart = (type) => {
      ElMessage({
        message: `导出${type}图表功能开发中...`,
        type: 'info'
      })
    }
    
    const exportTable = () => {
      ElMessage({
        message: '导出表格功能开发中...',
        type: 'info'
      })
    }
    
    onMounted(() => {
      getDetailStats()
    })
    
    return {
      loading,
      tableLoading,
      dateRange,
      detailTotal,
      detailQuery,
      overviewStats,
      activityStats,
      registrationData,
      answerDistribution,
      userDetailStats,
      calculateAccuracy,
      getActivityType,
      getActivityLabel,
      handleDateChange,
      refreshData,
      getDetailStats,
      exportChart,
      exportTable
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    margin: 0;
    color: #303133;
  }
  
  .date-filter {
    display: flex;
    gap: 10px;
    align-items: center;
  }
}

.stats-cards {
  margin-bottom: 20px;
  
  .stat-card {
    display: flex;
    align-items: center;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      
      i {
        font-size: 24px;
        color: white;
      }
      
      &.user-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.active-icon {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      &.answer-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
      
      &.accuracy-icon {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }
    
    .stat-content {
      flex: 1;
      
      .stat-number {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 5px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 5px;
      }
      
      .stat-change {
        font-size: 12px;
        
        &.positive {
          color: #67c23a;
        }
        
        &.negative {
          color: #f56c6c;
        }
      }
    }
  }
}

.charts-section {
  margin-bottom: 20px;
  
  .chart-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chart-container {
      height: 300px;
      
      .chart-placeholder {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: #f5f7fa;
        border: 2px dashed #dcdfe6;
        border-radius: 4px;
        color: #909399;
        
        .mock-chart-data {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          
          .chart-bar {
            display: flex;
            flex-direction: column;
            align-items: center;
            
            .bar {
              width: 20px;
              background: #409eff;
              border-radius: 2px;
              margin-bottom: 5px;
            }
            
            .bar-label {
              font-size: 12px;
              color: #606266;
            }
          }
        }
        
        .activity-stats {
          .activity-item {
            display: flex;
            justify-content: space-between;
            width: 200px;
            margin-bottom: 10px;
            
            .activity-label {
              color: #606266;
            }
            
            .activity-value {
              font-weight: bold;
              color: #409eff;
            }
          }
        }
        
        .answer-distribution {
          width: 80%;
          
          .distribution-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            
            .distribution-label {
              width: 80px;
              font-size: 12px;
              color: #606266;
            }
            
            .distribution-bar {
              flex: 1;
              height: 20px;
              background: #f0f0f0;
              border-radius: 10px;
              margin: 0 10px;
              overflow: hidden;
              
              .bar-fill {
                height: 100%;
                background: #409eff;
                border-radius: 10px;
                transition: width 0.3s ease;
              }
            }
            
            .distribution-value {
              width: 40px;
              text-align: right;
              font-size: 12px;
              color: #606266;
            }
          }
        }
        
        .user-distribution {
          .pie-chart-mock {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: conic-gradient(#409eff 0% 5%, #67c23a 5% 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 12px;
            
            .pie-slice {
              margin: 2px 0;
            }
          }
        }
      }
    }
  }
}

.table-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>