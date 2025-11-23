<template>
  <div class="modal-backdrop" @click.self="closeModal">
    <div class="register-card">
      <h2 class="title">注册账号</h2>
      <div class="divider"></div>

      <form @submit.prevent="handleSubmit" class="register-form">
        <!-- 用户名输入框 -->
        <div class="input-group">
          <i class="icon user-icon"></i> <!-- 使用通用图标或 lock-icon -->
          <input 
            v-model="form.username" 
            type="text" 
            placeholder="请输入9位数字用户名"
            required 
          />
        </div>

        <!-- 移除邮箱输入框 -->
        <!-- 移除验证码输入框和按钮 -->

        <!-- 密码输入框 -->
        <div class="input-group">
          <i class="icon lock-icon"></i> 
          <input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            required 
          />
        </div>

        <!-- 确认密码输入框 -->
        <div class="input-group">
          <i class="icon lock-icon"></i> 
          <input 
            v-model="form.confirmPassword" 
            type="password" 
            placeholder="确认密码"
            required 
          />
        </div>

        <button type="submit" class="submit-button">确 认</button>
      </form>

      <div class="links-row">
        <span @click="goToLogin" class="link-text">已有账号? <a href="#">去登录</a></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onBeforeUnmount } from 'vue';
// 移除了 axios，因为 auth.js 中已封装
import { PostRegister } from '@/api/auth';

// 定义组件的事件
const emit = defineEmits(['close', 'goToLogin']);

// 移除 email 和 verificationCode
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
});

// 移除所有验证码相关的 state 和
// let correctCode = '';
// const isSending = ref(false);
// const countdown = ref(0);
// let timer = null;

// onBeforeUnmount(() => {
//   if (timer) {
//     clearInterval(timer);
//   }
// });

// 移除 startCountdown
// 移除 generateRandomCode
// 移除 getVerificationCode

/**
 * 提交注册表单 (已移除验证码校验)
 */
const handleSubmit = async () => {
  if (form.password !== form.confirmPassword) {
    alert('两次输入的密码不一致！');
    return;
  }

  // 移除所有验证码校验逻辑
  // ...

  // 验证码校验通过，发送注册信息给后端
  try {
     // 只发送用户名和密码
     await PostRegister({
        username: form.username,
        password: form.password,
        // 假设后端的 email, phone, realName 等字段是可选的
        // 如果后端要求这些字段非空，您可能需要联系后端修改 API
     }).then(()=>{
        alert('注册成功！请前往登录。');
        emit('goToLogin');
     })

  } catch (error) {
    const errorMessage = error.response ? error.response.data.message : '网络连接失败。';
    alert(`注册失败: ${errorMessage}`);
    console.error('注册请求错误:', error);
  }
};

const closeModal = () => emit('close');
const goToLogin = () => emit('goToLogin');
</script>

<style scoped>
/* 大部分样式与 ChangePassword.vue 相同，保持一致性 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.register-card {
  width: 400px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  padding: 40px;
  box-sizing: border-box;
}

.title {
  text-align: center;
  font-size: 20px;
  color: #333;
  margin: 0 0 20px 0;
}

.divider {
  width: 100%;
  height: 1px;
  background-color: #eee;
  margin-bottom: 30px;
}

.input-group {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0 10px;
}

.input-group input {
  flex-grow: 1;
  border: none;
  padding: 12px 10px;
  outline: none;
  font-size: 14px;
}

/* 占位符图标 */
.icon {
  width: 16px;
  height: 16px;
  background-color: #999;
  margin-right: 10px;
}

/* 移除 email-icon 和 code-icon */

.lock-icon {
  background-color: #4A90E2;
}
.user-icon { /* 新增一个 user-icon 占位符 */
  background-color: #4A90E2;
}

/* 移除 verification-group 和 send-code-button 样式 */

.submit-button {
  width: 100%;
  padding: 14px;
  background-color: #4A90E2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 15px;
  margin-bottom: 30px;
}

.submit-button:hover {
  background-color: #357ABD;
}

.links-row {
  display: flex;
  justify-content: center;
  font-size: 14px;
  color: #666;
}

.link-text {
  cursor: pointer;
}

.link-text a {
  color: #4A90E2;
  text-decoration: none;
}
</style>