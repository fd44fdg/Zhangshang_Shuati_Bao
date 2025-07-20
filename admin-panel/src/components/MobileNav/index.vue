<template>
  <div class="mobile-nav">
    <el-button
      class="mobile-menu-btn"
      type="primary"
      :icon="sidebarOpen ? 'Close' : 'Menu'"
      @click="toggleSidebar"
    >
      {{ sidebarOpen ? '关闭菜单' : '打开菜单' }}
    </el-button>
  </div>
</template>

<script>
export default {
  name: 'MobileNav',
  data() {
    return {
      sidebarOpen: false
    }
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
      this.$emit('toggle-sidebar', this.sidebarOpen)
      
      // 添加/移除body类来控制侧边栏显示
      const sidebar = document.querySelector('.sidebar-container')
      if (sidebar) {
        if (this.sidebarOpen) {
          sidebar.classList.add('mobile-open')
        } else {
          sidebar.classList.remove('mobile-open')
        }
      }
    },
    
    // 点击遮罩层关闭侧边栏
    closeSidebar() {
      if (this.sidebarOpen) {
        this.sidebarOpen = false
        this.$emit('toggle-sidebar', false)
        const sidebar = document.querySelector('.sidebar-container')
        if (sidebar) {
          sidebar.classList.remove('mobile-open')
        }
      }
    }
  },
  
  mounted() {
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.sidebarOpen) {
        this.closeSidebar()
      }
    })
    
    // 点击侧边栏外部区域关闭侧边栏
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && this.sidebarOpen) {
        const sidebar = document.querySelector('.sidebar-container')
        const mobileNav = document.querySelector('.mobile-nav')
        
        if (sidebar && mobileNav && 
            !sidebar.contains(e.target) && 
            !mobileNav.contains(e.target)) {
          this.closeSidebar()
        }
      }
    })
  }
}
</script>

<style lang="scss" scoped>
.mobile-nav {
  display: none;
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1002;
  
  .mobile-menu-btn {
    padding: 8px 12px;
    font-size: 14px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

@media (max-width: 768px) {
  .mobile-nav {
    display: block;
  }
}

// 移动端侧边栏遮罩
@media (max-width: 768px) {
  :deep(.sidebar-container.mobile-open) {
    &::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: -1;
    }
  }
}
</style>