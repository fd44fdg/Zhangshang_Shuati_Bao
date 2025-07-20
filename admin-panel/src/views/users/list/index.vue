<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input
        v-model="listQuery.keyword"
        placeholder="搜索用户名/邮箱/手机号"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter="handleFilter"
      />
      <el-select
        v-model="listQuery.status"
        placeholder="状态"
        clearable
        style="width: 120px"
        class="filter-item"
      >
        <el-option label="正常" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-select
        v-model="listQuery.role"
        placeholder="角色"
        clearable
        style="width: 120px"
        class="filter-item"
      >
        <el-option label="管理员" value="admin" />
        <el-option label="普通用户" value="user" />
      </el-select>
      <el-date-picker
        v-model="listQuery.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        class="filter-item"
        style="width: 240px"
      />
      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="Search"
        @click="handleFilter"
      >
        搜索
      </el-button>
      <el-button
        class="filter-item"
        style="margin-left: 10px;"
        type="primary"
        icon="Plus"
        @click="handleCreate"
      >
        添加用户
      </el-button>
      <el-button
        class="filter-item"
        type="success"
        icon="Download"
        @click="handleExport"
      >
        导出
      </el-button>
    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
    >
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80">
        <template #default="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="头像" width="80px" align="center">
        <template #default="{row}">
          <el-avatar :size="40" :src="row.avatar" :alt="row.username">
            <img src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" />
          </el-avatar>
        </template>
      </el-table-column>
      <el-table-column label="用户名" width="150px">
        <template #default="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.username }}</span>
        </template>
      </el-table-column>
      <el-table-column label="真实姓名" width="120px">
        <template #default="{row}">
          <span>{{ row.real_name || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="邮箱" width="200px">
        <template #default="{row}">
          <span>{{ row.email }}</span>
        </template>
      </el-table-column>
      <el-table-column label="手机号" width="130px">
        <template #default="{row}">
          <span>{{ row.phone || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="角色" width="100px" align="center">
        <template #default="{row}">
          <el-tag :type="getRoleType(row.role)">{{ getRoleLabel(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="答题统计" width="120px" align="center">
        <template #default="{row}">
          <div class="stats-info">
            <div>总数: {{ row.total_answers }}</div>
            <div>正确: {{ row.correct_answers }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" class-name="status-col" width="100">
        <template #default="{row}">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最后登录" width="150px" align="center">
        <template #default="{row}">
          <span>{{ formatDate(row.last_login) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="150px" align="center">
        <template #default="{row}">
          <span>{{ formatDate(row.created_at) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="250" class-name="small-padding fixed-width">
        <template #default="{row, $index}">
          <el-button type="primary" size="small" @click="handleUpdate(row)">
            编辑
          </el-button>
          <el-button
            size="small"
            type="info"
            @click="handleViewStats(row)"
          >
            统计
          </el-button>
          <el-button
            v-if="row.status === 1"
            size="small"
            type="warning"
            @click="handleModifyStatus(row, 0)"
          >
            禁用
          </el-button>
          <el-button
            v-else
            size="small"
            type="success"
            @click="handleModifyStatus(row, 1)"
          >
            启用
          </el-button>
          <el-button
            size="mini"
            type="danger"
            @click="handleDelete(row, $index)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="listQuery.page"
      v-model:limit="listQuery.limit"
      @pagination="getList"
    />

    <!-- 用户编辑对话框 -->
    <el-dialog :title="textMap[dialogStatus]" v-model="dialogFormVisible" width="600px">
      <el-form
        ref="dataFormRef"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="100px"
        style="width: 500px; margin-left:50px;"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="temp.username"
            placeholder="请输入用户名"
            :disabled="dialogStatus === 'update'"
          />
        </el-form-item>
        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="temp.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="temp.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="temp.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item v-if="dialogStatus === 'create'" label="密码" prop="password">
          <el-input
            v-model="temp.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="temp.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="头像" prop="avatar">
          <el-input v-model="temp.avatar" placeholder="请输入头像URL" />
        </el-form-item>
        <el-form-item label="个人简介" prop="bio">
          <el-input
            v-model="temp.bio"
            type="textarea"
            :rows="3"
            placeholder="请输入个人简介"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="temp.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 用户统计对话框 -->
    <el-dialog title="用户统计" v-model="statsDialogVisible" width="800px">
      <div v-loading="statsLoading" class="stats-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">{{ userStats.total_answers }}</div>
              <div class="stat-label">总答题数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">{{ userStats.correct_answers }}</div>
              <div class="stat-label">正确答题数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">{{ userStats.accuracy }}%</div>
              <div class="stat-label">正确率</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-number">{{ userStats.study_days }}</div>
              <div class="stat-label">学习天数</div>
            </div>
          </el-col>
        </el-row>
        
        <div class="chart-container">
          <h3>答题趋势</h3>
          <div class="chart-placeholder">
            <p>答题趋势图表区域</p>
            <p>（此处可集成 ECharts 或其他图表库）</p>
          </div>
        </div>
        
        <div class="recent-activities">
          <h3>最近活动</h3>
          <el-table :data="userStats.recent_activities" style="width: 100%">
            <el-table-column prop="date" label="日期" width="150" />
            <el-table-column prop="activity" label="活动" />
            <el-table-column prop="result" label="结果" width="100">
              <template #default="{row}">
                <el-tag :type="row.result === '正确' ? 'success' : 'danger'">
                  {{ row.result }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Pagination from '@/components/Pagination/index.vue'
import waves from '@/directive/waves'
import { getUserList, createUser, updateUser, deleteUser, getUserStats } from '@/api/user'

export default {
  name: 'UserList',
  components: { Pagination },
  directives: { waves },
  setup() {
    const tableKey = ref(0)
    const list = ref([])
    const total = ref(0)
    const listLoading = ref(true)
    const dialogFormVisible = ref(false)
    const statsDialogVisible = ref(false)
    const statsLoading = ref(false)
    const dialogStatus = ref('')
    const dataFormRef = ref(null)
    
    const listQuery = reactive({
      page: 1,
      limit: 20,
      keyword: '',
      status: '',
      role: '',
      dateRange: []
    })
    
    const temp = reactive({
      id: undefined,
      username: '',
      real_name: '',
      email: '',
      phone: '',
      password: '',
      role: 'user',
      avatar: '',
      bio: '',
      status: 1
    })
    
    const userStats = reactive({
      total_answers: 0,
      correct_answers: 0,
      accuracy: 0,
      study_days: 0,
      recent_activities: []
    })
    
    const textMap = {
      update: '编辑用户',
      create: '创建用户'
    }
    
    const rules = {
      username: [
        { required: true, message: '用户名是必填项', trigger: 'blur' },
        { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '邮箱是必填项', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '密码是必填项', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ],
      role: [{ required: true, message: '角色是必填项', trigger: 'change' }]
    }
    

    
    const getRoleType = (role) => {
      return role === 'admin' ? 'danger' : 'primary'
    }
    
    const getRoleLabel = (role) => {
      return role === 'admin' ? '管理员' : '普通用户'
    }
    
    const getList = async () => {
      listLoading.value = true
      try {
        const params = {
          page: listQuery.page,
          limit: listQuery.limit,
          keyword: listQuery.keyword,
          status: listQuery.status,
          role: listQuery.role
        }
        
        const response = await getUserList(params)
        if (response.success) {
          list.value = response.data.users
          total.value = response.data.pagination.total
        } else {
          ElMessage.error(response.message || '获取用户列表失败')
        }
      } catch (error) {
        console.error('获取用户列表错误:', error)
        ElMessage.error('获取用户列表失败')
      } finally {
        listLoading.value = false
      }
    }
    
    const handleFilter = () => {
      listQuery.page = 1
      getList()
    }
    
    const resetTemp = () => {
      temp.id = undefined
      temp.username = ''
      temp.real_name = ''
      temp.email = ''
      temp.phone = ''
      temp.password = ''
      temp.role = 'user'
      temp.avatar = ''
      temp.bio = ''
      temp.status = 1
    }
    
    const handleCreate = () => {
      resetTemp()
      dialogStatus.value = 'create'
      dialogFormVisible.value = true
    }
    
    const createData = async () => {
      dataFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const userData = {
              username: temp.username,
              email: temp.email,
              password: temp.password,
              phone: temp.phone,
              nickname: temp.nickname || temp.username,
              role: temp.role,
              avatar: temp.avatar,
              bio: temp.bio,
              status: temp.status
            }
            
            const response = await createUser(userData)
            if (response.success) {
              dialogFormVisible.value = false
              ElMessage({
                message: '创建成功',
                type: 'success'
              })
              getList() // 重新加载列表
            } else {
              ElMessage.error(response.message || '创建用户失败')
            }
          } catch (error) {
            console.error('创建用户错误:', error)
            ElMessage.error('创建用户失败')
          }
        }
      })
    }
    
    const handleUpdate = (row) => {
      Object.assign(temp, JSON.parse(JSON.stringify(row)))
      temp.password = '' // 编辑时不显示密码
      dialogStatus.value = 'update'
      dialogFormVisible.value = true
    }
    
    const updateData = async () => {
      dataFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            const userData = {
              username: temp.username,
              email: temp.email,
              phone: temp.phone,
              nickname: temp.nickname,
              role: temp.role,
              avatar: temp.avatar,
              bio: temp.bio,
              status: temp.status
            }
            
            // 如果有新密码，则包含密码字段
            if (temp.password) {
              userData.password = temp.password
            }
            
            const response = await updateUser(temp.id, userData)
            if (response.success) {
              dialogFormVisible.value = false
              ElMessage({
                message: '更新成功',
                type: 'success'
              })
              getList() // 重新加载列表
            } else {
              ElMessage.error(response.message || '更新用户失败')
            }
          } catch (error) {
            console.error('更新用户错误:', error)
            ElMessage.error('更新用户失败')
          }
        }
      })
    }
    
    const handleDelete = async (row, index) => {
      if (row.role === 'admin') {
        ElMessage.error('不能删除管理员账户')
        return
      }
      
      ElMessageBox.confirm('此操作将永久删除该用户, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await deleteUser(row.id)
          if (response.success) {
            ElMessage({
              type: 'success',
              message: '删除成功!'
            })
            getList() // 重新加载列表
          } else {
            ElMessage.error(response.message || '删除用户失败')
          }
        } catch (error) {
          console.error('删除用户错误:', error)
          ElMessage.error('删除用户失败')
        }
      })
    }
    
    const handleModifyStatus = (row, status) => {
      if (row.role === 'admin' && status === 0) {
        ElMessage.error('不能禁用管理员账户')
        return
      }
      
      row.status = status
      ElMessage({
        message: '状态修改成功',
        type: 'success'
      })
    }
    
    const handleViewStats = async (row) => {
      statsLoading.value = true
      statsDialogVisible.value = true
      
      try {
        const response = await getUserStats(row.id)
        if (response.success) {
          const stats = response.data
          userStats.total_answers = stats.total_answers
          userStats.correct_answers = stats.correct_answers
          userStats.accuracy = stats.accuracy
          userStats.study_days = stats.study_days
          userStats.recent_activities = stats.recent_activities || []
        } else {
          ElMessage.error(response.message || '获取用户统计失败')
        }
      } catch (error) {
        console.error('获取用户统计错误:', error)
        ElMessage.error('获取用户统计失败')
      } finally {
        statsLoading.value = false
      }
    }
    
    const handleExport = () => {
      ElMessageBox.confirm(
        '确定要导出用户数据吗？',
        '导出确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        // 模拟导出过程
        const loading = ElLoading.service({
          lock: true,
          text: '正在导出数据...',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        
        setTimeout(() => {
          loading.close();
          
          // 生成CSV内容
          const csvContent = generateUserCSV();
          
          // 创建下载链接
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `用户数据_${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          ElMessage.success('导出成功！');
        }, 2000);
      }).catch(() => {
        ElMessage.info('已取消导出');
      });
    }
    
    // 生成用户CSV数据
    const generateUserCSV = () => {
      const headers = ['ID', '用户名', '邮箱', '真实姓名', '角色', '状态', '注册时间'];
      const csvRows = [headers.join(',')];
      
      list.value.forEach(user => {
        const row = [
          user.id,
          `"${user.username}"`,
          `"${user.email}"`,
          `"${user.real_name || '-'}"`,
          user.role === 'admin' ? '管理员' : '普通用户',
          user.status === 1 ? '正常' : '禁用',
          `"${formatDate(user.created_at)}"`
        ];
        csvRows.push(row.join(','));
      });
      
      return '\uFEFF' + csvRows.join('\n'); // 添加BOM以支持中文
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleString()
    }
    
    onMounted(() => {
      getList()
    })
    
    return {
      tableKey,
      list,
      total,
      listLoading,
      listQuery,
      dialogFormVisible,
      statsDialogVisible,
      statsLoading,
      dialogStatus,
      dataFormRef,
      temp,
      userStats,
      textMap,
      rules,
      getRoleType,
      getRoleLabel,
      getList,
      handleFilter,
      handleCreate,
      createData,
      handleUpdate,
      updateData,
      handleDelete,
      handleModifyStatus,
      handleViewStats,
      handleExport,
      formatDate
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.filter-container {
  padding-bottom: 10px;
}

.filter-item {
  display: inline-block;
  vertical-align: middle;
  margin-bottom: 10px;
  margin-right: 10px;
}

.link-type {
  color: #409EFF;
  cursor: pointer;
}

.link-type:hover {
  color: #66b1ff;
}

.stats-info {
  font-size: 12px;
  line-height: 1.4;
}

.stats-container {
  .stat-card {
    text-align: center;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 4px;
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #409eff;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #909399;
    }
  }
  
  .chart-container {
    margin-top: 30px;
    
    h3 {
      margin-bottom: 15px;
      color: #303133;
    }
    
    .chart-placeholder {
      height: 200px;
      background: #f5f7fa;
      border: 2px dashed #dcdfe6;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #909399;
    }
  }
  
  .recent-activities {
    margin-top: 30px;
    
    h3 {
      margin-bottom: 15px;
      color: #303133;
    }
  }
}
</style>