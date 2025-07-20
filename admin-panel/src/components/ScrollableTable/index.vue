<template>
  <div class="scrollable-table-container">
    <el-table
      ref="tableRef"
      :data="data"
      :height="tableHeight"
      :max-height="maxHeight"
      v-bind="$attrs"
      @scroll="handleScroll"
      class="scrollable-table"
    >
      <slot></slot>
    </el-table>
    
    <!-- 回到顶部按钮 -->
    <el-button
      v-if="showBackToTop"
      type="primary"
      :icon="ArrowUp"
      circle
      class="back-to-top-btn"
      @click="scrollToTop"
      title="回到顶部"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowUp } from '@element-plus/icons-vue'

export default {
  name: 'ScrollableTable',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    height: {
      type: [String, Number],
      default: 'auto'
    },
    maxHeight: {
      type: [String, Number],
      default: '70vh'
    },
    // 显示回到顶部按钮的滚动距离阈值
    backToTopThreshold: {
      type: Number,
      default: 200
    }
  },
  setup(props) {
    const tableRef = ref(null)
    const scrollTop = ref(0)
    const showBackToTop = ref(false)
    
    const tableHeight = computed(() => {
      if (props.height === 'auto') {
        return undefined
      }
      return props.height
    })
    
    const handleScroll = (event) => {
      const { scrollTop: currentScrollTop } = event.target
      scrollTop.value = currentScrollTop
      showBackToTop.value = currentScrollTop > props.backToTopThreshold
    }
    
    const scrollToTop = () => {
      if (tableRef.value) {
        const tableBody = tableRef.value.$el.querySelector('.el-table__body-wrapper')
        if (tableBody) {
          tableBody.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }
      }
    }
    
    // 监听表格滚动
    const bindScrollEvent = () => {
      if (tableRef.value) {
        const tableBody = tableRef.value.$el.querySelector('.el-table__body-wrapper')
        if (tableBody) {
          tableBody.addEventListener('scroll', handleScroll)
        }
      }
    }
    
    const unbindScrollEvent = () => {
      if (tableRef.value) {
        const tableBody = tableRef.value.$el.querySelector('.el-table__body-wrapper')
        if (tableBody) {
          tableBody.removeEventListener('scroll', handleScroll)
        }
      }
    }
    
    onMounted(() => {
      // 延迟绑定滚动事件，确保表格已渲染
      setTimeout(bindScrollEvent, 100)
    })
    
    onUnmounted(() => {
      unbindScrollEvent()
    })
    
    return {
      tableRef,
      tableHeight,
      showBackToTop,
      scrollToTop,
      ArrowUp
    }
  }
}
</script>

<style lang="scss" scoped>
.scrollable-table-container {
  position: relative;
  
  .scrollable-table {
    // 自定义滚动条样式
    :deep(.el-table__body-wrapper) {
      &::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
        
        &:hover {
          background: #a8a8a8;
        }
      }
    }
    
    // 固定表头样式优化
    :deep(.el-table__header-wrapper) {
      .el-table__header {
        th {
          background-color: #fafafa;
          border-bottom: 2px solid #e4e7ed;
        }
      }
    }
    
    // 表格行悬停效果
    :deep(.el-table__row) {
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: #f5f7fa;
      }
    }
  }
  
  .back-to-top-btn {
    position: absolute;
    right: 20px;
    bottom: 20px;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>