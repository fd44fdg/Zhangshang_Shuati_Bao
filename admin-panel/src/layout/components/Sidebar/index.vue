<template>
  <div class="sidebar">
    <div class="sidebar-logo">
      <h2>掌上刷题宝</h2>
      <span>管理后台</span>
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :collapse="false"
        :unique-opened="false"
        :collapse-transition="false"
        mode="vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <sidebar-item
          v-for="route in routes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarItem from './SidebarItem.vue'
import routerInstance from '@/router'

export default {
  name: 'Sidebar',
  components: {
    SidebarItem
  },
  setup() {
    const route = useRoute()
    
    const activeMenu = computed(() => {
      const { meta, path } = route
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    })

    const routes = computed(() => {
      return routerInstance.options.routes.filter(route => !route.hidden)
    })

    return {
      activeMenu,
      routes
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar {
  height: 100%;
  background-color: #304156;
  display: flex;
  flex-direction: column;

  .sidebar-logo {
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #434a50;
    flex-shrink: 0;
    
    h2 {
      color: #fff;
      margin: 0 0 5px 0;
      font-size: 18px;
      font-weight: 600;
    }
    
    span {
      color: #bfcbd9;
      font-size: 12px;
    }
  }

  :deep(.el-scrollbar) {
    flex: 1;
    overflow: hidden;
  }

  :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
  }

  :deep(.el-menu) {
    border: none;
    height: 100%;
    width: 100% !important;
  }

  :deep(.el-menu-item) {
    &.is-active {
      background-color: #263445 !important;
    }
  }

  :deep(.el-sub-menu__title) {
    &:hover {
      background-color: #263445 !important;
    }
  }

  :deep(.el-menu-item) {
    &:hover {
      background-color: #263445 !important;
    }
  }
}
</style>