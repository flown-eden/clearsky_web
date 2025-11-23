<template>
  <div id="app">

    <template v-if="!isLoggedIn">
      <div id="auth-view">
        <LoginForm v-if="currentView === 'login'" @goToRegister="currentView = 'register'"
          @loginSuccess="handleLoginSuccess" />

        <RegisterForm v-if="currentView === 'register'" @close="currentView = 'login'"
          @goToLogin="currentView = 'login'" />

      </div>
    </template>

    <HomePage v-else @logout="handleLogout" />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import LoginForm from './components/LoginForm.vue';
import RegisterForm from './components/RegisterForm.vue';
import HomePage from './components/HomePage.vue';

const isLoggedIn = ref(false);
const currentView = ref('login'); 

onMounted(() => {
  // 检查是否有 token 存在，实现自动登录/保持登录状态
  if (localStorage.getItem('user')) {
    isLoggedIn.value = true;
  }
});

/**
 * 接收到 LoginForm 发出的登录成功事件时调用
 */
const handleLoginSuccess = () => {
  isLoggedIn.value = true;
  currentView.value = 'home'; // 切换到主页视图（虽然主页不依赖 currentView，但保持状态一致）
};

/**
 * 接收到 HomePage 发出的登出事件时调用
 */
const handleLogout = () => {
  localStorage.removeItem('user');
  // localStorage.removeItem('userInfo');
  isLoggedIn.value = false;
  currentView.value = 'login'; // 返回到登录界面
};
</script>

<style>
/* 可以在这里设置全局背景色 */
body {
  background-color: #f0f4f8;
  /* 接近图片背景的淡蓝色 */
}

/* 确保body和html占据整个视口 */
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

/* 确保认证视图在未登录时能够居中显示 */
#auth-view {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  /* 当只显示弹窗时，LoginForm不再渲染，保持背景色 */
}
</style>
