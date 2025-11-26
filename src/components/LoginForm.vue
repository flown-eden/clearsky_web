<template>
  <div class="login-container">
    <div class="login-form-panel">
      <h2 class="welcome-text">
        欢迎使用<br />
        <span class="platform-name">clearsky心理测评平台</span>
      </h2>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label for="username" class="label-text">用户名:</label>
          <input id="username" v-model="loginForm.username" type="text" placeholder="请输入用户名" required
            class="input-field" />
        </div>

        <div class="input-group">
          <label for="password" class="label-text">密码:</label>
          <input id="password" v-model="loginForm.password" type="password" placeholder="请输入密码" required
            class="input-field" />
        </div>

        <div class="options-row">
          <label class="remember-me">
            <input type="checkbox" v-model="loginForm.rememberMe" />
            记住密码
          </label>
        </div>

        <button type="submit" class="login-button">立即登录</button>
      </form>

      <div class="register-link">
        没有账号? <a href="#" @click.prevent="openRegisterModal">去注册</a>
      </div>
    </div>
    <div class="info-panel">
      <div class="image-area" :style="{ backgroundImage: `url(${images[imageIndex]})` }">
        <div class="image-overlay"></div>
      </div>
      <div class="text-area">
        <h3>学生心理健康系统</h3>
        <p>学生心理测评、预警、干预、一体化平台</p>
        <div class="dots">
          <span v-for="(img, index) in images" :key="index" :class="{ 'active': index === imageIndex }"
            class="dot"></span>
        </div>
      </div>
    </div>


    <RegisterForm v-if="showRegisterModal" @close="closeRegisterModal" />
  </div>
</template>

<script setup lang="ts">
import {
  reactive,
  ref,
  onMounted,
  onBeforeUnmount
} from 'vue';
// import axios from 'axios';
import RegisterForm from './RegisterForm.vue';
import { useUserStore } from '@/stores/user.js';
import { PostLogin, PostRegister, PutPassword } from '@/api/auth'
// 静态导入图片文件。Vite 会将这些变量转换为正确的 URL 路径。
import image1 from '@/assets/images/login-background1.jpg';
import image2 from '@/assets/images/login-background2.jpg';
import image3 from '@/assets/images/login-background3.jpg';
const emit = defineEmits(['close', 'goToRegister', 'goToForget', 'loginSuccess']);
// const BASE_URL = 'http://localhost:8080/api/v1'; // <-- 定义基础URL
// 定义图片数组 (现在存储的是导入的 URL 字符串)
const images = [
  image1,
  image2,
  image3,
];

// ----------------- 图片轮播逻辑 -----------------
const imageIndex = ref(0);
let intervalId = null;
/**
 * 切换到下一张图片
 */
const nextImage = () => {
  imageIndex.value = (imageIndex.value + 1) % images.length;
};

/**
 * 获取当前图片的完整路径
 * Vite 在 JS/TS 中处理资源的推荐方式
 */


// 启动轮播
onMounted(() => {
  intervalId = setInterval(nextImage, 2500); // 每 1000ms (1秒) 切换
});

// 清理定时器，防止内存泄漏
onBeforeUnmount(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
// ----------------- 结束图片轮播逻辑 -----------------

const userStore = useUserStore();
// 响应式数据
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false,
});

/*处理登录逻辑*/
const handleLogin = async () => {
  // 简单校验
  if (!loginForm.username || !loginForm.password) {
    alert('请输入用户名和密码！');
    return;
  }

  // **********************************************
  // ************ 1. 前端测试账户模拟 *************
  // **********************************************
  const TEST_USERNAME = 'admin';
  const TEST_PASSWORD = '123456';
  // 2. CONSULTANT 测试账户
  const CONSULTANT_USERNAME = 'consultant';
  const CONSULTANT_PASSWORD = '123456';


  let roleToLogin = null;
  const usernameToLogin = loginForm.username;
  let realName = '测试用户';

  if (loginForm.username === TEST_USERNAME && loginForm.password === TEST_PASSWORD) {
    // 默认测试账户，可根据需要修改 role
    roleToLogin = 'ADMIN';
    realName = '系统管理员 (测试)';
  } else if (loginForm.username === CONSULTANT_USERNAME && loginForm.password === CONSULTANT_PASSWORD) {
    // 咨询师测试账户
    roleToLogin = 'CONSULTANT';
    realName = '李咨询师 (测试)';
  }

  if (roleToLogin) {
    // 模拟 API 返回的成功数据，用于保存
    const mockToken = 'mock-jwt-token-for-' + roleToLogin.toLowerCase();
    const mockUserInfo = {
      id: Math.floor(Math.random() * 1000) + 1000,
      username: usernameToLogin,
      realName: realName,
      role: roleToLogin, // 最终确定的角色
    };

    console.log(`✅ 成功使用测试账户 [${roleToLogin}] 登录。`);
    alert(`登录成功！欢迎, ${mockUserInfo.realName} (测试模式)`);

    // 保存 token 和用户信息
    userStore.setToken(mockToken)
    // localStorage.setItem('authToken', mockToken);
    userStore.setRole(mockUserInfo.role)
    userStore.setUsername(mockUserInfo.username)
    userStore.setRealName(mockUserInfo.realName)
    userStore.setId(mockUserInfo.id)
    // localStorage.setItem('userInfo', JSON.stringify(mockUserInfo));

    // 触发登录成功事件，跳转到首页
    emit('loginSuccess');
    return; // 结束登录流程
  }

  // **********************************************
  // ************ 2. 尝试调用后端 API *************
  // **********************************************

  try {
    console.log('尝试调用后端 API 登录...');

    await PostLogin(loginForm).then((result) => {
      // request 拦截器已在 code==200 时返回 data，这里直接拿到 payload
      const { token, userInfo } = result || {};

      if (!token || !userInfo) {
        throw new Error('登录返回数据不完整');
      }

      alert(`登录成功！欢迎, ${userInfo.realName || userInfo.username} (${userInfo.role})`);

      // 保存 token 和用户信息到 Pinia（拦截器会从 store 读取 token 附到请求头）
      userStore.setToken(token)
      userStore.setRole(userInfo.role)
      userStore.setUsername(userInfo.username)
      userStore.setRealName(userInfo.realName || '')
      userStore.setId(userInfo.id)

      // 触发登录成功事件，跳转到首页
      emit('loginSuccess');
    })
    // const response = await axios.post(`${BASE_URL}/auth/login`, {
    //   username: loginForm.username,
    //   password: loginForm.password
    // });
  } catch (error) {
    const errorMessage = error.response ? (error.response.data.message || '用户名或密码错误。') : '网络连接失败，请检查后端服务是否启动。';
    alert(errorMessage);
    console.error('登录请求错误:', error);
  }
};

// ****** 新增忘记密码弹窗控制逻辑 ******
const showRegisterModal = ref(false);
const openRegisterModal = () => {
  showRegisterModal.value = true;
};

const closeRegisterModal = () => {
  showRegisterModal.value = false;
};
// ****** 结束新增逻辑 ******

</script>

<style scoped>
/* 容器 */
.login-container {
  display: flex;
  max-width: 1000px;
  /* 假设的最大宽度 */
  margin: 50px auto;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  /* 确保圆角和内部分割线对齐 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* 左侧登录面板 */
.login-form-panel {
  flex: 1;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.welcome-text {
  font-size: 28px;
  font-weight: 300;
  color: #333;
  margin-bottom: 40px;
  line-height: 1.4;
}

.platform-name {
  font-size: 32px;
  font-weight: bold;
  color: #4A90E2;
  /* 蓝色 */
}

/* 表单通用样式 */
.login-form {
  width: 100%;
}

.input-group {
  margin-bottom: 20px;
}

.label-text {
  display: block;
  font-size: 14px;
  color: #555;
  margin-bottom: 5px;
}

.input-field {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
  /* 确保padding不增加总宽度 */
  transition: border-color 0.3s;
}

.input-field:focus {
  border-color: #4A90E2;
  outline: none;
}

/* 选项行：记住我 / 忘记密码 */
.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  font-size: 14px;
}

.remember-me {
  color: #666;
}

.forgot-password,
.register-link a {
  color: #4A90E2;
  text-decoration: none;
  transition: opacity 0.2s;
}

.forgot-password:hover,
.register-link a:hover {
  opacity: 0.8;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  padding: 14px;
  background-color: #4A90E2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 20px;
}

.login-button:hover {
  background-color: #357ABD;
}

/* 注册链接 */
.register-link {
  text-align: center;
  font-size: 14px;
  color: #999;
}

/* 右侧信息面板 */
.info-panel {
  flex: 1;
  background-color: #4A90E2;
  /* 底部蓝色背景 */
  display: flex;
  flex-direction: column;
}

/* 图片区域：占据上方大部分空间 */
.image-area {
  flex: 3;
  background-size: cover;
  background-position: center bottom;
  min-height: 250px;
  /* ****** 修改/新增样式：使背景图片平滑过渡 ****** */
  transition: background-image 0.8s ease-in-out;
  /* 尝试对背景图片设置过渡 (现代浏览器支持有限，辅助使用) */
  position: relative;
  /* 启用定位，以便放置覆盖层 */
  overflow: hidden;
  /* 防止过渡效果溢出 */
}

/* ****** 新增：用于平滑过渡的覆盖层 ****** */
.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0);
  /* 初始透明 */
  transition: opacity 1s ease;
  /* 透明度过渡 */
}

/* 文本区域：下方蓝色背景区域 */
.text-area {
  flex: 1;
  /* 占据较小比例 */
  padding: 30px;
  color: white;
  text-align: center;
}

.text-area h3 {
  font-size: 24px;
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 10px;
}

.text-area p {
  font-size: 14px;
  font-weight: 300;
  margin-bottom: 20px;
}

/* 底部圆点指示器 */
.dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  transition: background-color 0.3s;
}

.dot.active {
  background-color: white;
}
</style>
