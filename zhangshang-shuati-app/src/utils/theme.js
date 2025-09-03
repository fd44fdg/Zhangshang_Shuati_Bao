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
      // Delegate to a robust sync helper that centralizes uni calls and fallbacks
      try {
        syncNativeTheme(!!isDark)
      } catch (e) {
        // ignore platform-specific failures
      }
    }
  } catch (e) {
    // ignore
  }
}

// 将运行时 CSS 变量值同步到原生导航栏与 tabBar（覆盖 pages.json 中的静态配置）
function syncNativeTheme(isDark) {
  if (typeof uni === 'undefined') return

  const frontColor = getCssVar('--text-primary', isDark ? '#ffffff' : '#000000')
  const backgroundColor = getCssVar('--bg-color', isDark ? '#071022' : '#ffffff')
  const tabColor = getCssVar('--text-secondary', isDark ? '#9fb0c9' : '#8E8E93')
  const selectedColor = getCssVar('--accent-active', isDark ? '#60a5fa' : '#007AFF')

  // setNavigationBarColor: Android APP & 小程序端（有的端可能不支持）
  if (typeof uni.setNavigationBarColor === 'function') {
    try {
      uni.setNavigationBarColor({
        frontColor: frontColor,
        backgroundColor: backgroundColor
      })
    } catch (e) {
      // ignore
    }
  }

  // setTabBarStyle: 覆盖 tabBar 的 color/selectedColor/backgroundColor
  if (typeof uni.setTabBarStyle === 'function') {
    try {
      uni.setTabBarStyle({
        color: tabColor,
        selectedColor: selectedColor,
        backgroundColor: backgroundColor,
        borderStyle: isDark ? 'black' : 'white'
      })
    } catch (e) {
      // ignore
    }
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
