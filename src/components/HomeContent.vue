<template>
  <div class="home-content-container">
    <div class="clock-widget">
      <div class="clock-face">
        <!-- 时针 -->
        <div class="hand hour-hand" :style="{ transform: `rotate(${hoursDegrees}deg)` }"></div>
        <!-- 分针 -->
        <div class="hand minute-hand" :style="{ transform: `rotate(${minutesDegrees}deg)` }"></div>
        <!-- 秒针 -->
        <div class="hand second-hand" :style="{ transform: `rotate(${secondsDegrees}deg)` }"></div>
        <!-- 中心点 -->
        <div class="center-dot"></div>
      </div>
      <!-- 数字时间显示 -->
      <div class="digital-time">{{ digitalTime }}</div>
    </div>

    <div class="welcome-section">
      <h1 class="clearsky-text">ClearSky</h1>
      <div class="weather-widget">
        <div class="sun-icon"></div>
        <div class="cloud-icon"></div>
      </div>
      <p class="mood-prompt">今天心情怎么样?</p>
    </div>

    <div class="content-placeholder" v-if="userRole === 'ADMIN'">
      <div class="stats-grid">
        <div class="stat-card" @click="navigateTo('UserManagementPage', 'consultant-pending')">
          <div class="stat-value">{{ pendingConsultantsCount }}</div>
          <div class="stat-label">待审核咨询师</div>
        </div>
        <div class="stat-card" @click="navigateTo('CommunityPage')">
          <div class="stat-value">{{ pendingPostsCount }}</div>
          <div class="stat-label">待审核博文</div>
        </div>
        <div class="stat-card" @click="navigateTo('ConversationPage')">
          <div class="stat-value">{{ criticalConversationsCount }}</div>
          <div class="stat-label">待接管严重风险会话</div>
        </div>
      </div>
    </div>

    <div class="content-placeholder" v-else-if="userRole === 'CONSULTANT'">
      <div class="stats-grid">
        <div class="stat-card" @click="navigateTo('AppointmentPage')">
          <div class="stat-value">{{ pendingAppointmentsCount }}</div>
          <div class="stat-label">待审核预约</div>
        </div>
        <div class="stat-card" @click="navigateTo('ConversationPage')">
          <div class="stat-value">{{ criticalConversationsCount }}</div>
          <div class="stat-label">待接管严重风险会话</div>
        </div>
      </div>
    </div>

    <div class="content-placeholder" v-else>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useUserStore } from '@/stores/user';
import { GetPendingConsultants } from '@/api/user';
import { GetAdminPendingPosts } from '@/api/community';
import { GetConsultantList } from '@/api/consultant';
import { GetActiveConversations } from '@/api/conversations';

const userStore = useUserStore();
const userRole = ref('');

// 数据状态
const pendingConsultantsCount = ref(0);
const pendingPostsCount = ref(0);
const pendingAppointmentsCount = ref(0);
const criticalConversationsCount = ref(0);

// 时钟相关状态
const hoursDegrees = ref(0);
const minutesDegrees = ref(0);
const secondsDegrees = ref(0);
const digitalTime = ref('');

let clockInterval = null;

// 更新时钟显示
const updateClock = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // 计算角度
  const hoursDeg = (hours % 12) * 30 + minutes * 0.5; // 时针每小时30度，每分钟0.5度
  const minutesDeg = minutes * 6 + seconds * 0.1; // 分针每分钟6度，每秒0.1度
  const secondsDeg = seconds * 6; // 秒针每秒6度

  hoursDegrees.value = hoursDeg;
  minutesDegrees.value = minutesDeg;
  secondsDegrees.value = secondsDeg;

  // 更新数字时间显示
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hoursStr = String(hours).padStart(2, '0');
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(seconds).padStart(2, '0');
  digitalTime.value = `${year}-${month}-${day} ${hoursStr}:${minutesStr}:${secondsStr}`;
};

// 获取待审核咨询师数量
const fetchPendingConsultantsCount = async () => {
  try {
    const res = await GetPendingConsultants();
    let rawList = [];
    if (Array.isArray(res)) {
      rawList = res;
    } else if (res && Array.isArray(res.data)) {
      rawList = res.data;
    }
    pendingConsultantsCount.value = rawList.length;
  } catch (error) {
    console.error('获取待审核咨询师列表失败', error);
  }
};

// 获取待审核博文数量
const fetchPendingPostsCount = async () => {
  try {
    const res = await GetAdminPendingPosts();
    pendingPostsCount.value = Array.isArray(res) ? res.length : 0;
  } catch (error) {
    console.error('获取待审核博文列表失败', error);
  }
};

// 获取待审核预约数量 (咨询师角色)
const fetchPendingAppointmentsCount = async () => {
  try {
    const params = {
      page: 1,
      size: 1000,
      status: 'PENDING'
    };
    const res = await GetConsultantList(params);
    // 根据实际返回的数据结构调整
    if (res && Array.isArray(res.list)) {
      pendingAppointmentsCount.value = res.list.length;
    } else if (Array.isArray(res)) {
      pendingAppointmentsCount.value = res.length;
    } else {
      pendingAppointmentsCount.value = 0;
    }
  } catch (error) {
    console.error('获取待审核预约列表失败', error);
    pendingAppointmentsCount.value = 0;
  }
};

// 获取严重风险会话数量
const fetchCriticalConversationsCount = async () => {
  try {
    const params = {
      page: 1,
      size: 1000,
      status: 'ACTIVE',
      riskLevel: 'CRITICAL'
    };
    const res = await GetActiveConversations(params);
    if (res && Array.isArray(res.list)) {
      criticalConversationsCount.value = res.list.length;
    } else if (Array.isArray(res)) {
      criticalConversationsCount.value = res.length;
    } else {
      criticalConversationsCount.value = 0;
    }
  } catch (error) {
    console.error('获取严重风险会话列表失败', error);
    criticalConversationsCount.value = 0;
  }
};

// 导航到指定页面
const navigateTo = (page, tab = null) => {
  // 这里可以触发事件或者使用路由跳转
  // 由于是在组件内，我们通过事件传递给父组件处理
  const event = new CustomEvent('navigate', { detail: { page, tab } });
  window.dispatchEvent(event);
};

onMounted(async () => {
  userRole.value = userStore.role;

  // 初始化时钟显示并启动时钟
  updateClock();
  clockInterval = setInterval(updateClock, 1000);

  if (userRole.value === 'ADMIN') {
    // 获取管理员相关统计数据
    await Promise.all([
      fetchPendingConsultantsCount(),
      fetchPendingPostsCount(),
      fetchCriticalConversationsCount()
    ]);
  } else if (userRole.value === 'CONSULTANT') {
    // 获取咨询师相关统计数据
    await Promise.all([
      fetchPendingAppointmentsCount(),
      fetchCriticalConversationsCount()
    ]);
  }
});

// 组件卸载前清除定时器
onBeforeUnmount(() => {
  if (clockInterval) {
    clearInterval(clockInterval);
  }
});
</script>

<style scoped>
/* --- 样式移动自原 HomePage.vue --- */

/* 圆盘时钟样式 */
.clock-widget {
  position: absolute;
  top: 50px;
  right: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.clock-face {
  width: 120px;
  height: 120px;
  border: 5px solid #3b5998;
  border-radius: 50%;
  position: relative;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.hand {
  position: absolute;
  background-color: #3b5998;
  transform-origin: bottom center;
  left: 50%;
  bottom: 50%;
  border-radius: 2px;
  transform: translateX(-50%);
}

.hour-hand {
  width: 6px;
  height: 35px;
}

.minute-hand {
  width: 4px;
  height: 50px;
  background-color: #555;
}

.second-hand {
  width: 2px;
  height: 55px;
  background-color: #e74c3c;
}

.center-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  background-color: #e74c3c;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.digital-time {
  margin-top: 10px;
  font-size: 14px;
  font-weight: bold;
  color: #3b5998;
  font-family: 'Courier New', monospace;
}

/* clear sky 字体样式 */
.welcome-section {
  text-align: center;
  padding-top: 50px;
}

.clearsky-text {
  font-size: 80px;
  font-family: 'Times New Roman', Times, serif;
  font-weight: normal;
  color: #2c3e50;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 5px;
  margin-bottom: 20px;
}

/* 天气和心情提示 */
.weather-widget {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.sun-icon {
  width: 50px;
  height: 50px;
  background-color: #ffc107;
  border-radius: 50%;
}

.cloud-icon {
  width: 80px;
  height: 40px;
  background-color: #a0c4ff;
  border-radius: 20px;
  position: relative;
  top: -5px;
}

.cloud-icon::before {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  background-color: #a0c4ff;
  border-radius: 50%;
  left: 10px;
  top: -20px;
}

.cloud-icon::after {
  content: '';
  position: absolute;
  width: 50px;
  height: 50px;
  background-color: #a0c4ff;
  border-radius: 50%;
  right: 5px;
  top: -30px;
}

.mood-prompt {
  font-size: 24px;
  color: #7f8c8d;
  font-style: italic;
  margin-bottom: 40px;
}

.content-placeholder {
  /* 底部内容占位符 */
  min-height: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

/* 新增统计卡片样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  padding: 30px 20px;
  text-align: center;
  color: white;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.stat-value {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 1.2rem;
  opacity: 0.9;
}
</style>
