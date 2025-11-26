<template>
  <div class="modal-backdrop" @click.self="closeModal">
    <div class="forgot-password-card">
      <h2 class="title">修改密码</h2>
      <div class="divider"></div>

      <form @submit.prevent="handleSubmit" class="password-form">
        <div class="input-group">
          <i class="icon lock-icon"></i>
          <input
            v-model="form.oldPassword"
            type="password"
            placeholder="请输入旧密码"
            required
          />
        </div>

        <div class="input-group">
          <i class="icon lock-icon"></i>
          <input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码"
            required
          />
        </div>

        <div class="input-group">
          <i class="icon lock-icon"></i>
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="确认新密码"
            required
          />
        </div>

        <button type="submit" class="submit-button">确 认 修 改</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, onBeforeUnmount } from 'vue';
// 导入实际的 API 调用函数
// **注意：请根据您实际的文件路径修改下面的导入语句**
import { PutPassword } from '@/api/auth'; // 假设 auth.js 位于 '@/api/' 目录下

const emit = defineEmits(['close', 'switchToRegister']);
// BASE_URL 和 mockJwtToken 不再需要，因为 PutPassword 封装了这些逻辑
// const BASE_URL = 'http://localhost:8080/api/v1';
// const mockJwtToken = '...';

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// 清理逻辑（保持不变）
onBeforeUnmount(() => {
    // ...
});


/**
 * 提交密码修改
 */
const handleSubmit = async () => {
    // 1. 前端校验：两次新密码是否一致
    if (form.newPassword !== form.confirmPassword) {
        alert('两次输入的新密码不一致！');
        return;
    }

    if (!form.oldPassword || !form.newPassword) {
        alert('请填写所有必填信息！');
        return;
    }

    // 2. 构造 API 请求体 (与后端 API 的要求一致)
    const requestBody = {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
    };

    // 3. 调用实际的后端 API 函数
    try {
        // PutPassword(data) 函数会自动处理 URL: /auth/password 和 method: put
        await PutPassword(requestBody); // 不需要接收 response，或者接收了也不用检查

        // *** 修正点：如果代码执行到这里，说明 HTTP 请求成功，不再需要 if 检查 ***
        alert('密码修改成功！请使用新密码重新登录。');
        closeModal();

    } catch (error) {
        // PutPassword 内部的 request 函数应该会把 HTTP 错误抛出
        // 实际 API 错误处理（例如：旧密码错误，Token 失效等）
        const errorMessage = error.message || '修改失败，请检查旧密码或网络连接！';
        alert(`密码修改失败: ${errorMessage}`);
        console.error('密码修改请求错误:', error);
    }
};

/**
 * 关闭弹窗
 */
const closeModal = () => {
  emit('close');
};


</script>

<style scoped>
/* CSS 样式保持不变，只包含在下方 */
/* 模态框背景，用于覆盖整个屏幕 */
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
  z-index: 1000; /* 确保在最上层 */
}

/* 弹窗主体样式 */
.forgot-password-card {
  width: 400px; /* 弹窗宽度 */
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

/* 表单输入组 */
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

/* 占位符图标（使用字体图标或SVG图标代替） */
.icon {
  width: 16px;
  height: 16px;
  background-color: #999; /* 仅作为图标占位符，实际请替换为图标库 */
  margin-right: 10px;
}
/* 简单的图标占位符样式 */
.lock-icon { background-color: #4A90E2; }


/* 确认提交按钮 */
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

/* 底部链接行 */
.links-row {
  display: flex;
  justify-content: center;
  align-items: center;
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

.separator {
  width: 1px;
  height: 16px;
  background-color: #ccc;
  margin: 0 15px;
}
</style>
