<template>
  <div class="app-wrapper">
    <MobileNav @toggle-sidebar="handleToggleSidebar" />
    <div class="sidebar-container" :class="{ 'mobile-open': mobileMenuOpen }">
      <Sidebar />
    </div>
    <div class="main-container">
      <div class="fixed-header">
        <Navbar />
      </div>
      <AppMain />
    </div>
  </div>
</template>

<script>
import { Sidebar, Navbar, AppMain } from './components'
import MobileNav from '@/components/MobileNav'

export default {
  name: 'Layout',
  components: {
    Sidebar,
    Navbar,
    AppMain,
    MobileNav
  },
  data() {
    return {
      mobileMenuOpen: false
    }
  },
  methods: {
    handleToggleSidebar(isOpen) {
      this.mobileMenuOpen = isOpen
    }
  }
}
</script>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  height: 100vh;
  width: 100%;
  display: flex;

  .sidebar-container {
    width: 210px;
    height: 100vh;
    position: fixed;
    font-size: 0px;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1001;
    overflow: visible;
    background-color: #304156;
    transition: width 0.28s;
  }

  .main-container {
    min-height: 100vh;
    transition: margin-left 0.28s;
    margin-left: 210px;
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;

    .fixed-header {
      position: fixed;
      top: 0;
      right: 0;
      z-index: 9;
      width: calc(100% - 210px);
      transition: width 0.28s;
    }
  }
}

// 移动端响应式布局
@media (max-width: 768px) {
  .app-wrapper {
    .sidebar-container {
      width: 100%;
      transform: translateX(-100%);
      transition: transform 0.28s;
      
      &.mobile-open {
        transform: translateX(0);
      }
    }

    .main-container {
      margin-left: 0;
      width: 100%;

      .fixed-header {
        width: 100%;
        left: 0;
      }
    }
  }
}

@media (max-width: 480px) {
  .app-wrapper {
    .sidebar-container {
      width: 280px;
    }
  }
}
</style>