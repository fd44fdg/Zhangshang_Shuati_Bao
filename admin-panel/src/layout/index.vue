<template>
  <div class="app-wrapper">
    <div class="sidebar-container">
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

export default {
  name: 'Layout',
  components: {
    Sidebar,
    Navbar,
    AppMain
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
    overflow-y: auto;
    overflow-x: hidden;
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
</style>