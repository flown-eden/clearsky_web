<template>
  <div class="conversation-page">

    <h2 class="page-title">后台会话监控与管理</h2>

    <div class="header-controls">
      <div class="info-block">
        <template v-if="userRole === 'ADMIN'">
          💡 **系统管理员：** 仅可监控所有会话，并对高风险会话执行强制结束操作。
        </template>
        <template v-else-if="userRole === 'CONSULTANT'">
          💡 **心理咨询师：** 实时监控会话风险，可对**严重**风险的会话进行接管干预。
        </template>
      </div>

      <div class="action-buttons">
        <button class="search-btn" @click="fetchConversations">刷新列表</button>
        <button v-if="userRole === 'CONSULTANT'" class="action-btn-primary" @click="viewEscalatedConversations">
          查看待接管会话 ({{ pendingEscalations }})
        </button>
      </div>
    </div>

    <div class="conversation-table-section">

      <table class="data-table">
        <thead>
          <tr>
            <th>会话ID</th>
            <th>用户 (学号)</th>
            <th>会话开始时间</th>
            <th>时长</th>
            <th>风险状态</th>
            <th>当前状态</th>
            <!-- <th>操作</th> -->
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in conversations" :key="index"
            :class="{ 'risk-severe-row': item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH' }">
            <td>{{ item.id }}</td>
            <td>{{ item.user }}</td>
            <td>{{ item.createdAt ? item.createdAt.replace('T', ' ') : '' }}</td>
            <td>15:32</td>
            <td>
              <span :class="['risk-tag', 'risk-severe']"
                v-if="item.riskLevel == 'CRITICAL' || item.riskLevel == 'HIGH'">严重</span>
              <span :class="['risk-tag', 'risk-medium']" v-if="item.riskLevel == 'MEDIUM'">中</span>
              <span :class="['risk-tag', 'risk-low']" v-if="item.riskLevel == 'LOW'">低</span>
            </td>
            <td>
              <span v-for="(status, index) in converStatus" :key="index">
                <span v-if="item.status === status.value">{{ status.label }}</span>
              </span>
            </td>
            <!-- <td>
              <button v-if="userRole === 'ADMIN'" class="action-btn end-btn"
                @click="handleForceEnd(conversations[0].id)">
                强制结束
              </button>
              <button
                v-if="userRole === 'CONSULTANT' && conversations[0].riskStatus === '严重' && !conversations[0].isTakenOver"
                class="action-btn takeover-btn" @click="handleTakeOver(conversations[0].id, conversations[0].username)">
                立即接管
              </button>
              <span v-else-if="conversations[0].isTakenOver" class="taken-over-text">已接管</span>
            </td> -->
          </tr>
          <!-- <tr :class="{ 'risk-severe-row': conversations[1].riskStatus === '严重' }">
            <td>C002</td>
            <td>王小明 (100000002)</td>
            <td>2025-11-01 11:00</td>
            <td>08:10</td>
            <td><span :class="['risk-tag', 'risk-medium']">{{ conversations[1].riskStatus }}</span></td>
            <td>AI 对话中</td>
            <td>
              <button v-if="userRole === 'ADMIN'" class="action-btn end-btn"
                @click="handleForceEnd(conversations[1].id)">
                强制结束
              </button>
              <span v-else>无权限操作</span>
            </td>
          </tr>
          <tr :class="{ 'risk-severe-row': conversations[2].riskStatus === '严重' }">
            <td>C003</td>
            <td>陈同学 (100000010)</td>
            <td>2025-11-01 12:00</td>
            <td>03:45</td>
            <td><span :class="['risk-tag', 'risk-low']">{{ conversations[2].riskStatus }}</span></td>
            <td>AI 对话中</td>
            <td><span>无操作</span></td>
          </tr> -->
        </tbody>
      </table>

      <div class="pagination">...</div>
    </div>

    <div v-if="showChatModal" class="modal-overlay">
      <div class="chat-modal">
        <h3>接管会话：{{ currentChatUser }} (ID: {{ currentChatId }})</h3>
        <div class="chat-box">
          <div class="messages">
            <div class="message user-message">用户：我真的不知道该怎么办，太痛苦了。 (AI判定：严重风险)</div>
            <div class="message system-message">系统：您好，我是心理咨询师XX，我接管了您的会话，请您慢慢告诉我发生了什么...</div>
          </div>
          <div class="input-area">
            <input type="text" placeholder="输入消息..." class="chat-input">
            <button class="send-btn">发送</button>
          </div>
        </div>
        <button class="close-btn" @click="closeChatModal">结束接管</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  GetActiveConversations,
} from '@/api/conversations';
const userRole = ref(null);
const pendingEscalations = ref(1); // 模拟待接管会话数

// 模态框状态
const showChatModal = ref(false);
const currentChatId = ref(null);
const currentChatUser = ref('');
const converForm = ref({
  page: 1,
  size: 10,
  status: ''
});
// 模拟实时会话数据
const conversations = ref([
  { id: 'C001', username: '李同学', studentId: '100000003', riskStatus: '严重', isTakenOver: false },
  { id: 'C002', username: '王小明', studentId: '100000002', riskStatus: '中', isTakenOver: false },
  { id: 'C003', username: '陈同学', studentId: '100000010', riskStatus: '低', isTakenOver: false },
]);
const converStatus = ref([
  { label: '活跃', value: 'ACTIVE' },
  { label: '已升级', value: 'ESCALATED' },
  { label: '已完成', value: 'COMPLETED' },
])
onMounted(() => {
  const storedUserInfo = localStorage.getItem('user');
  if (storedUserInfo) {
    try {
      const userInfo = JSON.parse(storedUserInfo);
      userRole.value = userInfo.role ? userInfo.role.toUpperCase() : 'ADMIN';
    } catch (e) {
      userRole.value = 'ADMIN';
    }
  } else {
    userRole.value = 'ADMIN';
  }
  fetchConversations();
});

// --- API & 权限方法 ---

const fetchConversations = async () => {
  await GetActiveConversations(converForm.value).then((res) => {
    console.log(res);

    conversations.value = res.list;
  })
  // 模拟数据刷新
  // 实际应用中，这里应是 WebSocket 或长轮询
};

/**
 * 管理员操作：强制结束会话
 */
const handleForceEnd = async (id) => {
  if (userRole.value !== 'ADMIN') {
    alert('权限不足！只有系统管理员可以强制结束会话。');
    return;
  }
  if (confirm(`ADMIN 确定强制结束会话 ID: ${id} 吗？这会向用户发送终止通知。`)) {
    console.log(`[API] 强制结束会话 ID: ${id}，调用 POST /admin/conversations/${id}/force-end`);
    // 实际：更新列表，移除该会话
    await PostForceEnd(id)
    fetchConversations();

  }
};

/**
 * 咨询师操作：接管严重风险会话
 */
const handleTakeOver = (id, username) => {
  if (userRole.value !== 'CONSULTANT') {
    alert('权限不足！只有心理咨询师可以接管会话。');
    return;
  }
  if (confirm(`CONSULTANT 确定接管会话 ID: ${id} (用户: ${username}) 吗？`)) {
    console.log(`[API] 咨询师接管会话 ID: ${id}，调用 POST /consultant/conversations/${id}/takeover`);

    // 1. 标记为已接管
    const conv = conversations.value.find(c => c.id === id);
    if (conv) conv.isTakenOver = true;

    // 2. 弹出聊天窗口
    currentChatId.value = id;
    currentChatUser.value = username;
    showChatModal.value = true;
    pendingEscalations.value = Math.max(0, pendingEscalations.value - 1); // 模拟减少待接管数
  }
};

const closeChatModal = () => {
  if (confirm('确定要结束本次接管吗？')) {
    console.log(`[API] 咨询师结束接管会话 ID: ${currentChatId.value}，调用 POST /consultant/conversations/${currentChatId.value}/release`);

    // 1. 释放会话（或者彻底结束）
    const conv = conversations.value.find(c => c.id === currentChatId.value);
    if (conv) conv.isTakenOver = false;

    // 2. 关闭模态框
    showChatModal.value = false;
    currentChatId.value = null;
    currentChatUser.value = '';
  }
};

const viewEscalatedConversations = () => {
  console.log('[UI] 筛选列表，只显示待接管 (严重风险) 的会话。');
};
</script>

<style scoped>
/* ************************************************* */
/* *************** 后台会话管理页面样式 ****************** */
/* ************************************************* */

.conversation-page {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100%;
}

.page-title {
  font-size: 26px;
  color: #2c3e50;
  margin-bottom: 25px;
  font-weight: 700;
  border-bottom: 3px solid #3b5998;
  padding-bottom: 10px;
}

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.info-block {
  background-color: #e6f7ff;
  border-left: 5px solid #1890ff;
  color: #1890ff;
  padding: 12px 20px;
  border-radius: 4px;
  font-size: 14px;
  flex-grow: 1;
  margin-right: 20px;
}

/* --- 按钮样式 (沿用) --- */
.action-buttons {
  display: flex;
  gap: 10px;
}

.search-btn {
  background-color: #8c9fae;
}

.action-btn-primary {
  background-color: #f5222d;
}

/* 待接管按钮使用红色警示 */
.action-btn-primary:hover {
  background-color: #cf1322;
}

/* --- 表格区域 --- */
.conversation-table-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 15px 12px;
  text-align: left;
  background: #fff;
}

.data-table th {
  background-color: #f7f9fa;
  font-weight: 600;
  color: #595959;
}

.data-table tr {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

/* ！！！ 严重风险的醒目提醒 ！！！ */
.risk-severe-row {
  background-color: #fff1f0;
  /* 浅红背景 */
  border: 2px solid #ff7875;
  animation: pulse 1.5s infinite alternate;
  /* 呼吸灯效果 */
}

@keyframes pulse {
  from {
    box-shadow: 0 0 10px rgba(245, 34, 45, 0.3);
  }

  to {
    box-shadow: 0 0 15px rgba(245, 34, 45, 0.8);
  }
}

/* 风险标签 */
.risk-tag {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 13px;
  color: white;
}

.risk-low {
  background-color: #52c41a;
}

.risk-medium {
  background-color: #faad14;
}

.risk-high {
  background-color: #ff7875;
}

.risk-severe {
  background-color: #f5222d;
  /* 红色 */
  border: 1px solid white;
}

/* 操作按钮 */
.action-btn {
  padding: 8px 12px;
  margin-right: 5px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: white;
}

.end-btn {
  background-color: #ff4d4f;
}

/* 强制结束 */
.end-btn:hover {
  background-color: #cf1322;
}

.takeover-btn {
  background-color: #13c2c2;
}

/* 立即接管 */
.takeover-btn:hover {
  background-color: #2ab8b8;
}

.taken-over-text {
  color: #52c41a;
  font-weight: 600;
}

/* --- 实时聊天模态框 --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  /* 高于其他模态框 */
}

.chat-modal {
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 700px;
  height: 90vh;
  /* 较高的聊天界面 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
}

.chat-modal h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #3b5998;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.chat-box {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
}

.messages {
  flex-grow: 1;
  padding: 15px;
  overflow-y: auto;
  background-color: #f7f9fa;
}

.message {
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 6px;
  max-width: 80%;
  font-size: 14px;
  line-height: 1.6;
}

.user-message {
  background-color: #ffe7ba;
  margin-left: auto;
  color: #595959;
}

.system-message {
  background-color: #e6f7ff;
  margin-right: auto;
  color: #1890ff;
}

.input-area {
  display: flex;
  padding: 10px;
  border-top: 1px solid #d9d9d9;
  background: white;
}

.chat-input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-right: 10px;
}

.send-btn {
  padding: 10px 15px;
  background-color: #3b5998;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.close-btn {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
