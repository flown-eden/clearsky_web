<template>
  <div class="home-container">
    <aside class="sidebar">
      <div class="logo-area">
        <img :src="logoPng" alt="ClearSky Logo" class="app-logo">
      </div>
      <nav class="main-menu">

  <div class="menu-item" :class="{ active: currentView === 'HomeContent' }" @click="changeContent('HomeContent')">
    <i class="fa-solid fa-house"></i>
    <span>首页</span>
  </div>

  <div class="menu-item" :class="{ active: currentView === 'DashboardPage' }"
    @click="changeContent('DashboardPage')">
    <i class="fa-solid fa-chart-line"></i>
    <span>仪表盘</span>
  </div>

  <div 
    class="menu-item" 
    @click="changeContent('AppointmentPage')" 
    v-if="userStore.role !== 'ADMIN'"
    :class="{ active: currentView === 'AppointmentPage' }"
  >
    <i class="fa-solid fa-calendar-check"></i>
    <span>预约管理</span>
  </div>
  
  <div class="menu-item" @click="changeContent('UserManagementPage')"
      :class="{ active: currentView === 'UserManagementPage' }">
    <i class="fa-solid fa-users"></i>
    <span>用户管理</span>
  </div>
  <div class="menu-item" @click="changeContent('ResourcePage')"
      :class="{ active: currentView === 'ResourcePage' }">
    <i class="fa-solid fa-book-open"></i>
    <span>资源管理</span>
  </div>
  <div class="menu-item" @click="changeContent('CommunityPage')"
      :class="{ active: currentView === 'CommunityPage' }">
    <i class="fa-solid fa-people-group"></i>
    <span>社区管理</span>
  </div>
  <div class="menu-item" @click="changeContent('ConversationPage')"
      :class="{ active: currentView === 'ConversationPage' }">
    <i class="fa-solid fa-comments"></i>
    <span>后台会话管理</span>
  </div>
</nav>

      <div class="sidebar-footer">
        <button @click="openChangePasswordModal" class="change-password-btn">修改密码</button>
        <button @click="logout" class="logout-btn">退出登录</button>
      </div>

    </aside>
    <main class="main-content">
    <header class="top-header">
    <div class="user-profile">
      <span class="username">{{ userStore.realName || userStore.username || '用户' }}</span>
      <img :src="userStore.avatarUrl || '/default-avatar.png'" alt="用户头像" class="avatar">
    </div>
    </header>
      <!-- 渲染当前视图组件 -->
      <component :is="componentMap[currentView]" />
    </main>

    <!-- ChangePassword 模态框 -->
    <ChangePassword v-if="showChangePasswordModal" @close="closeChangePasswordModal" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'; 
import { useUserStore } from '@/stores/user'; 
import logoPng from '@/assets/images/logo.png'; 
import HomeContent from './HomeContent.vue';      
import DashboardPage from './DashboardPage.vue';  
import AppointmentPage from './AppointmentPage.vue';
import UserManagementPage from './UserManagementPage.vue';
import TestManagementPage from './TestManagementPage.vue';
import CommunityPage from './CommunityPage.vue';
import ResourcePage from './ResourcePage.vue'; 
import ConversationPage from './ConversationPage.vue'; 
import ChangePassword from './ChangePassword.vue';

const componentMap = {
  HomeContent,
  DashboardPage,
  AppointmentPage,
  UserManagementPage,
  TestManagementPage,
  ResourcePage,
  CommunityPage,
  ConversationPage,
};


const emit = defineEmits(['logout']);
const currentView = ref('HomeContent');
const showChangePasswordModal = ref(false);

const userStore = useUserStore();


const changeContent = (viewName) => {
  currentView.value = viewName;
};

const logout = () => {
  // 登出时调用 Store 中的移除 action 来清除状态
  userStore.removeToken();
  userStore.removeRole();
  userStore.removeRealName();
  userStore.removeUsername();
  userStore.removeId();
  
  // 通知 App.vue 执行登出逻辑
  emit('logout'); 
};

const openChangePasswordModal = () => { 
  showChangePasswordModal.value = true;
};

const closeChangePasswordModal = () => { 
  showChangePasswordModal.value = false;
};
</script>

<style scoped>
/* 整体布局 */
.home-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f7f9fc;
}


/* 侧边栏样式 */
.sidebar {
  width: 200px;
  background-color: #3b5998; /* 统一的蓝色调 */
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  padding-bottom: 20px;
}

/* FIXED: logo-area 样式修改，使其占据更多空间并居中内容 */
.logo-area {
  min-height: 140px; 
  display: flex; 
  justify-content: center;
  align-items: center;
  text-align: center;
  border-bottom: 1px solid #4c69b0;
}

.app-logo {
  max-width: 100%; 
  max-height: 100%; 
  height: auto;
  margin-bottom: 0; 
}

.main-menu {
  flex-grow: 1; 
  padding-top: 10px;
}

.main-menu .menu-item {
  padding: 15px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
  font-size: 16px;
}

.main-menu .menu-item:hover {
  background-color: #4c69b0;
}
.main-menu .menu-item.active {
  background-color: #4c69b0;
  
  /* 确保边框是内嵌的，并且与 padding 正确配合 */
  border-left: 4px solid #ffffff;
  
  /* 确保左侧内边距被边框“挤压”了 4px */
  padding-left: 16px; /* 20px (原始) - 4px (border) = 16px */
  
  /* 确保右侧 padding 保持一致 */
  padding-right: 20px;
}
.main-menu .menu-item i {
  /* Font Awesome 的 i 标签 */
  margin-right: 10px;
  font-size: 18px; /* 调整图标大小 */
  color: #ffffff; /* 确保图标在深色背景上可见 */
}

/* 登出按钮 */
.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #4c69b0;
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #c0392b;
}

/* 侧边栏底部按钮新增样式 */
.change-password-btn {
  width: 100%;
  padding: 10px;
  background-color: #4A90E2; 
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
  margin-bottom: 10px; 
}

.change-password-btn:hover {
  background-color: #357ABD;
}


/* 主内容区域 - 
   注意：由于 Header 现在仍在 main-content 内部，为了防止它遮挡内容，
   我们需要给 main-content 顶部预留出 Header 的高度空间。
*/
.main-content {
  flex-grow: 1;
  /* 移除原始 padding: 20px; */
  padding: 0 20px 20px 20px; /* 只保留左右和底部的 padding */
  overflow-y: auto; 
  position: relative; /* 确保 top-header 的定位基准是 main-content */
}

/* ---------------------------------------------------- */
/* 新增/修改的顶部 Header 样式 - 关键定位修改 */
/* ---------------------------------------------------- */
.top-header {
  position: absolute; /* 关键：脱离文档流，浮动起来 */
  top: 0;             /* 定位到 main-content 的顶部 */
  right: 20px;        /* 定位到 main-content 的右侧内边距边缘 */
  height: 60px;       /* 设定高度 */
  display: flex;
  justify-content: flex-end; 
  align-items: center;
  background-color: transparent; /* 背景透明，或与页面背景色一致 */
  z-index: 100;       /* 确保它在所有内容之上 */
  /* 不要设置 width: 100%; 否则它会占据 main-content 的全部宽度，并遮挡内容 */
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-profile:hover {
  background-color: #f0f0f0;
}

.username {
  margin-right: 10px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.avatar {
  width: 36px; 
  height: 36px;
  border-radius: 50%; 
  object-fit: cover; 
  border: 2px solid #3b5998; 
}
</style>