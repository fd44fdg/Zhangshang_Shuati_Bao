<template>
  <div :class="{'hidden':hidden}" class="pagination-container">
    <el-pagination
      :background="background"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :layout="layout"
      :page-sizes="pageSizes"
      :total="total"
      v-bind="$attrs"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'Pagination',
  props: {
    total: {
      required: true,
      type: Number
    },
    page: {
      type: Number,
      default: 1
    },
    limit: {
      type: Number,
      default: 20
    },
    pageSizes: {
      type: Array,
      default() {
        return [10, 20, 30, 50]
      }
    },
    layout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    background: {
      type: Boolean,
      default: true
    },
    autoScroll: {
      type: Boolean,
      default: true
    },
    hidden: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:page', 'update:limit', 'pagination'],
  setup(props, { emit }) {
    const currentPage = computed({
      get() {
        return props.page
      },
      set(val) {
        emit('update:page', val)
      }
    })
    
    const pageSize = computed({
      get() {
        return props.limit
      },
      set(val) {
        emit('update:limit', val)
      }
    })
    
    const handleSizeChange = (val) => {
      emit('pagination', { page: currentPage.value, limit: val })
      if (props.autoScroll) {
        scrollTo(0, 800)
      }
    }
    
    const handleCurrentChange = (val) => {
      emit('pagination', { page: val, limit: pageSize.value })
      if (props.autoScroll) {
        scrollTo(0, 800)
      }
    }
    
    const scrollTo = (element, duration) => {
      if (typeof element === 'number') {
        element = document.documentElement
      }
      if (!element) return
      
      const start = element.scrollTop
      const change = 0 - start
      const increment = 20
      let currentTime = 0
      
      const animateScroll = function() {
        currentTime += increment
        const val = Math.easeInOutQuad(currentTime, start, change, duration)
        element.scrollTop = val
        if (currentTime < duration) {
          setTimeout(animateScroll, increment)
        }
      }
      animateScroll()
    }
    
    // Math.easeInOutQuad function
    Math.easeInOutQuad = function(t, b, c, d) {
      t /= d / 2
      if (t < 1) {
        return c / 2 * t * t + b
      }
      t--
      return -c / 2 * (t * (t - 2) - 1) + b
    }
    
    return {
      currentPage,
      pageSize,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.pagination-container {
  background: #fff;
  padding: 32px 16px;
}
.pagination-container.hidden {
  display: none;
}
</style>