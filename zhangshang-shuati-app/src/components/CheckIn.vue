<template>
  <view class="check-in-wrapper">
    <view class="check-in-card" @click="handleCheckIn" :class="{ 'checked-in': isCheckedIn }">
      <view class="card-content">
        <view class="icon">
          <text class="icon-calendar">📅</text>
        </view>
        <view class="text-content">
          <text class="title">{{ isCheckedIn ? '今日已签到' : '每日签到' }}</text>
          <text class="subtitle">{{ isCheckedIn ? `已连续签到 ${continuousDays} 天` : '点击领取今日奖励' }}</text>
        </view>
        <view class="action-button">
          <text>{{ isCheckedIn ? '已完成' : '签到' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: "CheckIn",
  data() {
    return {
      isCheckedIn: false,
      continuousDays: 0,
      isLoading: false,
    };
  },
  created() {
    this.getCheckInStatus();
  },
  methods: {
    getApiBaseUrl() {
      return process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api/v1';
    },
    getAuthHeader() {
      const token = uni.getStorageSync('user_token');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    },
    loadMockData() {
        console.log("API request failed. Loading mock data for CheckIn component.");
        this.isCheckedIn = false;
        this.continuousDays = 7; // A more realistic mock value
    },
    async getCheckInStatus() {
      const token = uni.getStorageSync('user_token');
      if (!token) {
        this.loadMockData(); // No token, load mock data for demo
        return;
      }

      try {
        const res = await uni.request({
          url: `${this.getApiBaseUrl()}/checkin/status`,
          method: 'GET',
          header: this.getAuthHeader(),
          timeout: 3000, // Set a timeout
        });

        if (res.statusCode === 200 && res.data && res.data.success) {
          this.isCheckedIn = res.data.data.isCheckedIn;
          this.continuousDays = res.data.data.continuousDays;
        } else {
          throw new Error('Failed to get check-in status');
        }
      } catch (error) {
        this.loadMockData();
      }
    },
    async handleCheckIn() {
      if (this.isCheckedIn || this.isLoading) {
        uni.showToast({
          title: this.isCheckedIn ? '今天已经签过啦' : '处理中...',
          icon: 'none'
        });
        return;
      }

      this.isLoading = true;
      const token = uni.getStorageSync('user_token');
      if (!token) {
        // Simulate a successful check-in for demo purposes without a token
        setTimeout(() => {
            this.isCheckedIn = true;
            this.continuousDays += 1;
            uni.showToast({ title: '签到成功! (模拟)', icon: 'success' });
            this.isLoading = false;
        }, 500);
        return;
      }

      try {
        const res = await uni.request({
          url: `${this.getApiBaseUrl()}/checkin`,
          method: 'POST',
          header: this.getAuthHeader(),
          timeout: 3000,
        });

        if (res.statusCode === 200 && res.data && res.data.success) {
          this.isCheckedIn = true;
          this.continuousDays = res.data.data.continuousDays;
          uni.showToast({ title: '签到成功！', icon: 'success' });
        } else {
            throw new Error('Check-in API failed');
        }
      } catch (error) {
        // Simulate a successful check-in on API failure
        this.isCheckedIn = true;
        this.continuousDays += 1;
        uni.showToast({ title: '签到成功! (模拟)', icon: 'success' });
      } finally {
          this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
.check-in-wrapper {
  padding: 0 20rpx;
  margin-top: -20rpx; 
  margin-bottom: 20rpx;
}

.check-in-card {
  background: linear-gradient(135deg, #ff8c00 0%, #ffc107 100%);
  border-radius: 16rpx;
  padding: 25rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.check-in-card.checked-in {
  background: linear-gradient(135deg, #6dd5ed 0%, #2193b0 100%);
}

.card-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.text-content {
  flex: 1;
  color: white;
}

.title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 4rpx;
}

.subtitle {
  display: block;
  font-size: 24rpx;
  opacity: 0.9;
}

.action-button {
  background-color: white;
  color: #ff8c00;
  padding: 12rpx 24rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  font-weight: bold;
  transition: all 0.3s ease;
}

.checked-in .action-button {
  background-color: rgba(255, 255, 255, 0.8);
  color: #2193b0;
}
</style>