<template>
  <div class="appointment-page">
    <h2 class="page-title">预约管理中心</h2>



    <template v-if="userRole === 'CONSULTANT'">
      <ConsultantAppointmentView />
    </template>



  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import ConsultantAppointmentView from './Appointment/ConsultantAppointmentView.vue';

// 存储从本地获取的用户真实角色
const userRole = ref(null);

onMounted(() => {
    // 实际项目中，这里会从 localStorage 或 Pinia/Vuex 获取已登录用户的 role
    const storedUserInfo = localStorage.getItem('user');
    if (storedUserInfo) {
        try {
            const userInfo = JSON.parse(storedUserInfo);
            // 确保角色是有效的字符串
            userRole.value = userInfo.role ? userInfo.role.toUpperCase() : null;
        } catch (e) {
            console.error("解析用户信息失败", e);
            userRole.value = null;
        }
    }
});

// 计算属性：用于在提示信息中显示更友好的角色名
const displayRole = computed(() => {
    switch (userRole.value) {
        case 'USER':
            return '学生用户';
        case 'ADMIN':
            return '系统管理员';
        case 'CONSULTANT':
            return '心理咨询师';
        default:
            return '未登录/未知用户';
    }
});

// 移除了 switchRoleView 函数，严格禁止权限不足时的手动切换
</script>

<style scoped>
/* 保持其他样式不变，仅更新权限提示样式，使其更强调警告 */

.permission-alert {
    background-color: #fff1f0; /* 柔和的警告红 */
    border: 1px solid #ff4d4f; /* 红色边框 */
    color: #cf1322;
    padding: 30px;
    margin-top: 30px;
    border-radius: 12px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.alert-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.alert-content h3 {
    font-size: 24px;
    margin-bottom: 10px;
    color: #cf1322;
}

.alert-content p {
    font-size: 16px;
    margin-bottom: 15px;
}

.role-switch-hint {
    font-size: 14px;
    color: #8c8c8c;
    border-top: 1px dashed #ffccc7;
    padding-top: 15px;
    margin-top: 15px;
    width: 100%;
}
</style>
