<template>
  <view class="modern-icon" :class="{ 'modern-icon--active': active }">
    <image 
      :src="iconSrc" 
      :style="{ width: size + 'px', height: size + 'px' }"
      mode="aspectFit"
      class="icon-image"
      :class="{ 'icon-image--active': active }"
    />
  </view>
</template>

<script>
export default {
  name: 'ModernIcon',
  props: {
    type: {
      type: String,
      default: 'home',
      validator: (value) => {
        return ['home', 'practice', 'exam', 'profile', 'search', 'favorite', 'settings'].includes(value)
      }
    },
    active: {
      type: Boolean,
      default: false
    },
    size: {
      type: [String, Number],
      default: 24
    },
    color: {
      type: String,
      default: ''
    }
  },
  computed: {
    iconSrc() {
      const iconMap = {
        'home': this.active ? '/static/icons/home-active.png' : '/static/icons/home.png',
        'practice': this.active ? '/static/icons/practice-active.png' : '/static/icons/practice.png',
        'exam': this.active ? '/static/icons/exam-active.png' : '/static/icons/exam.png',
        'profile': this.active ? '/static/icons/profile-active.png' : '/static/icons/profile.png',
        'search': '/static/icons/home.png', // 使用home图标作为默认
        'favorite': '/static/icons/favorites.png',
        'settings': '/static/icons/settings.png'
      };
      return iconMap[this.type] || iconMap['home'];
    },
    iconColor() {
      if (this.color) return this.color
      return this.active ? '#007AFF' : '#8E8E93'
    }
  }
}
</script>

<style scoped>
.modern-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.modern-icon--active {
  transform: scale(1.1);
}

.icon-image {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 0 transparent);
}

.icon-image--active {
  filter: drop-shadow(0 2px 8px rgba(0, 122, 255, 0.3));
}

.modern-icon--active .icon-image {
  filter: drop-shadow(0 2px 8px rgba(0, 122, 255, 0.3));
}

/* 悬停效果 */
/* #ifdef H5 */
.modern-icon:hover {
  transform: scale(1.05);
}

.modern-icon:hover .icon-image {
  filter: drop-shadow(0 1px 4px rgba(0, 122, 255, 0.2));
}
/* #endif */

/* 动画关键帧 */
@keyframes iconPulse {
  0%, 100% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(1.15);
  }
}

.modern-icon--active.pulse {
  animation: iconPulse 2s infinite;
}
</style>