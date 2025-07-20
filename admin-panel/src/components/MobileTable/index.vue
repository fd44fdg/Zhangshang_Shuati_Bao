<template>
  <div class="mobile-table">
    <!-- 移动端卡片式布局 -->
    <div v-if="isMobile" class="mobile-cards">
      <div 
        v-for="(item, index) in data" 
        :key="index" 
        class="mobile-card"
      >
        <div class="card-header">
          <span class="card-title">{{ getCardTitle(item) }}</span>
          <div class="card-actions">
            <slot name="actions" :row="item" :index="index"></slot>
          </div>
        </div>
        <div class="card-content">
          <div 
            v-for="column in visibleColumns" 
            :key="column.prop" 
            class="card-field"
          >
            <span class="field-label">{{ column.label }}:</span>
            <span class="field-value">
              <slot 
                v-if="column.slot" 
                :name="column.slot" 
                :row="item" 
                :index="index"
              ></slot>
              <span v-else>{{ getFieldValue(item, column.prop) }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 桌面端表格布局 -->
    <el-table 
      v-else
      v-bind="$attrs"
      :data="data"
      v-on="$listeners"
    >
      <el-table-column label="ID" prop="id" sortable="custom" align="center" width="80">
        <template #default="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="题目内容" min-width="300px">
        <template #default="{row}">
          <div class="question-content">
            <p>{{ row.content }}</p>
            <div v-if="row.type !== 'fill'" class="options">
              <div v-for="(option, index) in row.options" :key="index" class="option-item">
                <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
                <span>{{ option }}</span>
                <el-tag v-if="isCorrectAnswer(row, index)" type="success" size="small">正确答案</el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="100px" align="center">
        <template #default="{row}">
          <slot name="type" :row="row"></slot>
        </template>
      </el-table-column>
      <el-table-column label="难度" width="100px" align="center">
        <template #default="{row}">
          <slot name="difficulty" :row="row"></slot>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="120px" align="center">
        <template #default="{row}">
          <slot name="category" :row="row"></slot>
        </template>
      </el-table-column>
      <el-table-column label="状态" class-name="status-col" width="100">
        <template #default="{row}">
          <slot name="status" :row="row"></slot>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="150px" align="center">
        <template #default="{row}">
          <slot name="created_at" :row="row"></slot>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
        <template #default="{row, $index}">
          <slot name="actions" :row="row" :index="$index"></slot>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'MobileTable',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      default: () => []
    },
    titleField: {
      type: String,
      default: 'id'
    },
    mobileBreakpoint: {
      type: Number,
      default: 768
    }
  },
  data() {
    return {
      isMobile: false
    }
  },
  computed: {
    visibleColumns() {
      return this.columns.filter(col => !col.hideInMobile)
    }
  },
  methods: {
    checkMobile() {
      this.isMobile = window.innerWidth <= this.mobileBreakpoint
    },
    
    getCardTitle(item) {
      return item[this.titleField] || `项目 ${this.data.indexOf(item) + 1}`
    },
    
    getFieldValue(item, prop) {
      return this.getNestedValue(item, prop)
    },
    
    getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : ''
      }, obj)
    },
    
    isCorrectAnswer(row, index) {
      if (row.type === 'single') {
        return row.correct_answer === index
      } else if (row.type === 'multiple') {
        return Array.isArray(row.correct_answer) && row.correct_answer.includes(index)
      } else if (row.type === 'boolean') {
        return row.correct_answer === index
      }
      return false
    }
  },
  
  mounted() {
    this.checkMobile()
    window.addEventListener('resize', this.checkMobile)
  },
  
  beforeDestroy() {
    window.removeEventListener('resize', this.checkMobile)
  }
}
</script>

<style lang="scss" scoped>
.mobile-table {
  width: 100%;
}

.mobile-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.card-title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.card-actions {
  display: flex;
  gap: 4px;
  
  :deep(.el-button) {
    padding: 4px 8px;
    font-size: 12px;
    min-height: auto;
  }
}

.card-content {
  padding: 12px 16px;
}

.card-field {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.field-label {
  font-weight: 500;
  color: #666;
  font-size: 13px;
  min-width: 80px;
  flex-shrink: 0;
}

.field-value {
  color: #333;
  font-size: 13px;
  text-align: right;
  flex: 1;
  margin-left: 12px;
  word-break: break-word;
  
  :deep(.el-tag) {
    font-size: 11px;
    padding: 2px 6px;
    height: auto;
    line-height: 1.2;
  }
}

// 响应式优化
@media (max-width: 480px) {
  .mobile-card {
    margin: 0 -5px;
    border-radius: 6px;
  }
  
  .card-header {
    padding: 10px 12px;
  }
  
  .card-content {
    padding: 10px 12px;
  }
  
  .card-field {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  
  .field-label {
    margin-bottom: 4px;
    min-width: auto;
  }
  
  .field-value {
    margin-left: 0;
    text-align: left;
  }
  
  .card-actions {
    flex-wrap: wrap;
    
    :deep(.el-button) {
      padding: 3px 6px;
      font-size: 11px;
    }
  }
}
</style>