<template>
  <div class="dashboard-container">
    <div class="dashboard-text">欢迎使用掌上刷题宝管理后台</div>
    
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon user-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.userCount }}</div>
              <div class="stats-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon question-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.questionCount }}</div>
              <div class="stats-label">题目总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon category-icon">
              <el-icon><Folder /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.categoryCount }}</div>
              <div class="stats-label">分类总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon answer-icon">
              <el-icon><EditPen /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ stats.answerCount }}</div>
              <div class="stats-label">答题总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>用户注册趋势</span>
          </template>
          <div ref="userChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>题目分类分布</span>
          </template>
          <div ref="categoryChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 最近活动 -->
    <el-row :gutter="20" class="activity-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>最近活动</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="activity.time"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import * as echarts from 'echarts'
import { User, Document, Folder, EditPen } from '@element-plus/icons-vue'
import { 
  fetchSystemStats, 
  fetchRecentActivities, 
  fetchUserGrowthData, 
  fetchCategoryDistribution 
} from '@/api/admin'

export default {
  name: 'Dashboard',
  components: {
    User,
    Document,
    Folder,
    EditPen
  },
  setup() {
    const userChartRef = ref(null)
    const categoryChartRef = ref(null)
    
    const stats = reactive({
      userCount: 0,
      questionCount: 0,
      categoryCount: 0,
      answerCount: 0
    })
    
    const recentActivities = ref([])
    const loading = ref(false)
    
    const initUserChart = (growthData) => {
      const chart = echarts.init(userChartRef.value)
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: growthData.months || ['1月', '2月', '3月', '4月', '5月', '6月']
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: growthData.data || [120, 200, 150, 80, 70, 110],
          type: 'line',
          smooth: true,
          itemStyle: {
            color: '#409EFF'
          }
        }]
      }
      chart.setOption(option)
    }
    
    const initCategoryChart = (categoryData) => {
      const chart = echarts.init(categoryChartRef.value)
      const option = {
        tooltip: {
          trigger: 'item'
        },
        series: [{
          type: 'pie',
          radius: '50%',
          data: categoryData || [
            { value: 1048, name: 'JavaScript' },
            { value: 735, name: 'Vue.js' },
            { value: 580, name: 'React' },
            { value: 484, name: 'Node.js' },
            { value: 300, name: '其他' }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }
      chart.setOption(option)
    }
    
    // 加载仪表板数据
    const loadDashboardData = async () => {
      loading.value = true
      try {
        // 并行加载所有数据
        const [statsRes, activitiesRes, growthRes, categoryRes] = await Promise.all([
          fetchSystemStats(),
          fetchRecentActivities(),
          fetchUserGrowthData(),
          fetchCategoryDistribution()
        ])
        
        // 更新统计数据
        if (statsRes.data) {
          Object.assign(stats, statsRes.data)
        }
        
        // 更新活动记录
        if (activitiesRes.data) {
          recentActivities.value = activitiesRes.data
        }
        
        // 更新图表
        if (growthRes.data) {
          initUserChart(growthRes.data)
        }
        
        if (categoryRes.data) {
          initCategoryChart(categoryRes.data)
        }
      } catch (error) {
        console.error('加载仪表板数据失败:', error)
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      loadDashboardData()
    })
    
    return {
      userChartRef,
      categoryChartRef,
      stats,
      recentActivities,
      loading
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-text {
  font-size: 30px;
  line-height: 46px;
  margin-bottom: 30px;
  color: #333;
  font-weight: 600;
}

.stats-row {
  margin-bottom: 30px;
}

.stats-card {
  .stats-content {
    display: flex;
    align-items: center;
    
    .stats-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      
      .el-icon {
        font-size: 24px;
        color: #fff;
      }
      
      &.user-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.question-icon {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      &.category-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
      
      &.answer-icon {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }
    
    .stats-info {
      .stats-number {
        font-size: 28px;
        font-weight: 600;
        color: #333;
        margin-bottom: 5px;
      }
      
      .stats-label {
        font-size: 14px;
        color: #666;
      }
    }
  }
}

.charts-row {
  margin-bottom: 30px;
}

.activity-row {
  margin-bottom: 30px;
}
</style>