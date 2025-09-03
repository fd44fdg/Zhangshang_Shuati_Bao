// 主题工具：负责在不同平台应用深色/浅色主题
import settings from './settings'

const THEME_CLASS = 'dark-mode'
function getCssVar(name, fallback) {
  try {
    if (typeof document !== 'undefined' && document.documentElement) {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name)
      if (v) return v.trim()
    }
  } catch (e) {}
  return fallback
}

function applyThemeFromSettings() {
  const s = settings.getSettings()
  applyTheme(s && s.darkMode)
}

function setMetaThemeColor(color) {
  try {
    if (typeof document !== 'undefined') {
      let meta = document.querySelector('meta[name="theme-color"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'theme-color'
        document.head.appendChild(meta)
      }
      meta.content = color
    }
  } catch (e) {
    // ignore
  }
}

function applyTheme(isDark) {
  // H5 上通过 body class 切换主题样式并设置 meta theme-color
  try {
    if (typeof window !== 'undefined' && document && document.body) {
      if (isDark) {
        document.body.classList.add(THEME_CLASS)
  setMetaThemeColor(getCssVar('--bg-color', '#0b1320'))
      } else {
        document.body.classList.remove(THEME_CLASS)
  setMetaThemeColor(getCssVar('--bg-color', '#ffffff'))
      }
    }
  } catch (e) {
    // ignore
  }

  // 尝试在 uni-app 环境更新导航栏和 tab 样式（APP / 小程序）
  try {
    if (typeof uni !== 'undefined') {
      // 设置导航栏颜色（部分平台支持）
      if (uni.setNavigationBarColor) {
        try {
          uni.setNavigationBarColor({
            frontColor: getCssVar('--text-primary', isDark ? '#ffffff' : '#000000'),
            backgroundColor: getCssVar('--bg-color', isDark ? '#0b1320' : '#ffffff')
          })
        } catch (e) {}
      }

      // 设置 tabBar 样式（如果页面使用 tabBar）
      if (uni.setTabBarStyle) {
        try {
          uni.setTabBarStyle({
            color: getCssVar('--text-secondary', isDark ? '#9fb0c9' : '#8E8E93'),
            selectedColor: getCssVar('--accent-active', isDark ? '#60a5fa' : '#007AFF'),
            backgroundColor: getCssVar('--bg-color', isDark ? '#071022' : '#ffffff'),
            borderStyle: isDark ? 'black' : 'white'
          })
        } catch (e) {}
      }
    }
  } catch (e) {
    // ignore
  }
}

function toggleTheme() {
  const current = settings.getSetting('darkMode')
  settings.setSetting('darkMode', !current)
  applyTheme(!current)
  return !current
}

export default {
  applyThemeFromSettings,
  applyTheme,
  toggleTheme
}
