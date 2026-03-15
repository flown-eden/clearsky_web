<template>
  <div class="conversation-page">

    <h2 class="page-title">后台会话监控与管理</h2>

    <div class="header-controls">
      <div class="info-block">
        <template v-if="userRole === 'ADMIN'">
          💡 系统管理员：仅对高风险或严重风险会话显示“接管会话”按钮。接管后会话状态将升级为已升级。
        </template>
        <template v-else-if="userRole === 'CONSULTANT'">
          💡 心理咨询师：重点关注严重风险会话。请及时接管风险等级为“严重”或“高”的学生会话并进行干预。
        </template>
      </div>

      <div class="action-buttons">
        <button class="search-btn" @click="fetchConversations">刷新列表</button>
        <button v-if="userRole === 'CONSULTANT'" class="action-btn-primary" @click="filterSevereConversations">
          待接管的严重风险会话 ({{ severeCount }})
        </button>
      </div>
    </div>

    <div class="conversation-table-section">
      <div class="filter-bar" style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
        <label>状态筛选：</label>
        <select v-model="converForm.status" @change="fetchConversations" class="status-select">
          <option value="">全部</option>
          <option v-for="s in converStatus" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>

        <label>风险筛选：</label>
        <select v-model="converForm.riskLevel" @change="fetchConversations" class="status-select">
          <option value="">全部风险</option>
          <option value="LOW">低风险</option>
          <option value="MEDIUM">中风险</option>
          <option value="HIGH">高风险</option>
          <option value="CRITICAL">严重风险</option>
        </select>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>会话ID</th>
            <th>用户 (ID)</th> <th>开始时间</th>
            <th>风险等级</th>
            <th>当前状态</th>
            <th width="220">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in conversations" :key="item.id || index"
            :class="{ 'risk-severe-row': item.riskLevel === 'CRITICAL' }">
            <td>{{ item.id }}</td>
            <td>
              <span class="student-id">
                用户ID: {{ item.userId ? item.userId : '--' }}
              </span>
            </td>
            <td>{{ formatTime(item.createdAt) }}</td>

            <td>
              <span :class="['risk-tag', getRiskClass(item.riskLevel)]">
                {{ getRiskLabel(item.riskLevel) }}
              </span>
            </td>

            <td>
              <span v-if="item.status === 'ESCALATED'" class="status-escalated">已升级(人工)</span>
              <span v-else-if="item.status === 'ACTIVE'" class="status-active">AI进行中</span>
              <span v-else-if="item.status === 'COMPLETED'" class="status-completed">已结束</span>
              <span v-else>{{ item.status }}</span>
            </td>

            <td>
              <template v-if="item.status === 'ESCALATED'">
                <button class="action-btn chat-btn" @click="openChatModal(item)">
                  进入沟通
                </button>
                 <button class="action-btn end-btn" @click="handleEndConversation(item)">
                  结束会话
                </button>
              </template>

              <template v-else-if="item.status === 'ACTIVE'">
                <button
                  v-if="(userRole === 'ADMIN' || userRole === 'CONSULTANT') && (item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH')"
                  class="action-btn takeover-btn"
                  @click="handleTakeOverPrompt(item)">
                  {{ userRole === 'ADMIN' ? '接管会话' : '立即干预' }}
                </button>

                <span v-else class="no-action-text">
                   {{ item.riskLevel === 'LOW' || item.riskLevel === 'MEDIUM' ? '暂无需干预' : '无权限操作' }}
                </span>
              </template>

              <template v-else-if="item.status === 'COMPLETED'">
                 <button class="action-btn view-btn" @click="openChatModal(item)">查看记录</button>
              </template>
            </td>
          </tr>
          <tr v-if="conversations.length === 0">
            <td colspan="6" class="empty-text">暂无数据</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button :disabled="converForm.page <= 1" @click="changePage(-1)">上一页</button>
        <span>第 {{ converForm.page }} 页</span>
        <button @click="changePage(1)">下一页</button>
      </div>
    </div>

    <div v-if="showChatModal" class="modal-overlay">
      <div class="chat-modal">
        <div class="modal-header">
          <h3>
            <span v-if="isReadOnlyMode">查看记录</span>
            <span v-else>实时干预</span>
            : {{ currentChatUser }} (会话ID: {{ currentChatId }})
          </h3>
          <button class="close-icon" @click="closeChatModal">×</button>
        </div>

        <div class="chat-box" ref="chatBoxRef">
          <div class="messages" id="message-container">
            <div v-if="loadingMessages" class="loading-text">加载消息记录中...</div>

        <div
          v-for="(msg, idx) in messageList"
          :key="idx"
          :class="['message', getMessageClass(msg.senderType)]" >
          <div class="msg-sender">
            {{ getSenderLabel(msg.senderType) }} <span class="msg-time">{{ formatTime(msg.createdAt, true) }}</span>
          </div>
          <div class="msg-content">{{ msg.content }}</div>
        </div>
          </div>

          <div class="input-area" v-if="!isReadOnlyMode">
            <input
              type="text"
              v-model="replyContent"
              @keyup.enter="handleSendReply"
              placeholder="输入回复内容，按回车发送..."
              class="chat-input"
              :disabled="sending"
            >
            <button class="send-btn" @click="handleSendReply" :disabled="sending">
              {{ sending ? '发送中...' : '发送' }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue';
import { GetActiveConversations, GetConversationDetail, PostAdminTakeover, PostReply, PostEndConversation } from '@/api/conversations';
import wsService from '@/utils/websocket';

// --- 状态变量 ---
const userRole = ref('ADMIN');
const conversations = ref([]);
const messageList = ref([]);
const showChatModal = ref(false);
const currentChatId = ref(null);
const currentChatUser = ref('');
const replyContent = ref('');
const sending = ref(false);
const loadingMessages = ref(false);
const isReadOnlyMode = ref(false);

// 定时器引用
const refreshTimer = ref(null);
const chatRefreshTimer = ref(null); // 添加这一行用于聊天界面的定时刷新

// 筛选表单: 包含 riskLevel
const converForm = ref({
  page: 1,
  size: 10,
  status: '',
  riskLevel: ''
});

const converStatus = [
  { label: '活跃 (AI托管)', value: 'ACTIVE' },
  { label: '已升级 (人工介入)', value: 'ESCALATED' },
  { label: '已结束', value: 'COMPLETED' },
];

// severeCount 计算逻辑保留
const severeCount = computed(() => {
  return conversations.value.filter(c => c.riskLevel === 'CRITICAL' && c.status === 'ACTIVE').length;
});

// 启动定时刷新
const startAutoRefresh = () => {
  // 清除可能存在的旧定时器
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
  }

  // 设置新的定时器，每秒刷新一次
  refreshTimer.value = setInterval(() => {
    fetchConversations();
  }, 1000);
};

// 启动聊天界面定时刷新
const startChatAutoRefresh = () => {
  // 清除可能存在的旧定时器
  if (chatRefreshTimer.value) {
    clearInterval(chatRefreshTimer.value);
  }

  // 设置新的定时器，每秒刷新一次聊天内容
  chatRefreshTimer.value = setInterval(() => {
    if (currentChatId.value) {
      refreshChatMessages();
    }
  }, 1000);
};

// 停止聊天界面定时刷新
const stopChatAutoRefresh = () => {
  if (chatRefreshTimer.value) {
    clearInterval(chatRefreshTimer.value);
    chatRefreshTimer.value = null;
  }
};

// 刷新聊天消息
const refreshChatMessages = async () => {
  try {
    // 保存当前滚动位置
    const chatBox = document.getElementById('message-container');
    let isScrolledToBottom = true;

    if (chatBox) {
      // 判断用户是否在底部（允许一些误差）
      const threshold = 10;
      isScrolledToBottom = chatBox.scrollHeight - chatBox.clientHeight - chatBox.scrollTop < threshold;
    }

    const res = await GetConversationDetail(currentChatId.value);

    // 只有当新消息与当前消息不同（数量增加）时才更新列表
    if (res.messages && res.messages.length !== messageList.value.length) {
      messageList.value = res.messages || [];

      // 只有在原本就在底部时才滚动到底部
      if (isScrolledToBottom) {
        scrollToBottom();
      }
    }
  } catch (error) {
    console.error("刷新聊天消息失败", error);
  }
};

// 停止定时刷新
const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
};

// --- 生命周期 & 初始化 ---
onMounted(() => {
  const storedUserInfo = localStorage.getItem('user');
  if (storedUserInfo) {
    try {
      const userInfo = JSON.parse(storedUserInfo);
      userRole.value = userInfo.role ? userInfo.role.toUpperCase() : 'ADMIN';
    } catch (e) { console.error("解析用户信息失败", e); }
  }
  fetchConversations();
  // 启动自动刷新 (已使用 WebSocket)
  // startAutoRefresh();
  
  // 连接 WebSocket
  wsService.connect();
});

// 组件卸载时清除定时器
onUnmounted(() => {
  stopAutoRefresh();
  stopChatAutoRefresh(); // 添加这一行来清理聊天界面定时器
  wsService.disconnect();
});

// --- API 交互方法 ---

// 获取列表 (适配新的 API 路径和响应结构)
const fetchConversations = async () => {
  try {
    const res = await GetActiveConversations(converForm.value);
    // 【关键修正点】将 res.records 改回 res.list
    conversations.value = res.list || [];
  } catch (error) {
    console.error("加载会话列表失败", error);
    conversations.value = [];
  }
};

// 分页
const changePage = (delta) => {
  converForm.value.page += delta;
  fetchConversations();
};

// 仅看严重风险 (CONSULTANT 快捷筛选)
const filterSevereConversations = () => {
  // 设置筛选参数
  converForm.value.status = 'ACTIVE';
  converForm.value.riskLevel = 'CRITICAL';
  converForm.value.page = 1;
  // 调用 API
  fetchConversations();
};

// 【重要】接管逻辑 (保持不变，功能已完整保留)
const handleTakeOverPrompt = async (item) => {
  // 业务逻辑限制：仅允许接管 HIGH 或 CRITICAL 风险的会话
  if (item.riskLevel !== 'CRITICAL' && item.riskLevel !== 'HIGH') {
    alert('当前会话风险等级不满足人工接管条件。');
    return;
  }

  const roleName = userRole.value === 'ADMIN' ? '管理员' : '咨询师';

  // 1. 获取接管原因 (reason)
  const reason = prompt(`${roleName}接管确认：\n请输入接管原因 (必填):`, "检测到高风险内容，需人工介入");
  if (!reason) return;

  // 2. 自动构造发送给用户的第一条消息 (不再弹窗询问，直接进入 WebSocket 实时通讯)
  const firstMessage = `你好，我是${roleName}，我注意到了你的困扰，我们可以聊聊吗？`;

  try {
    await PostAdminTakeover(item.id, {
      reason: reason,
      content: firstMessage
    });

    alert('接管成功！会话状态已更新为已升级(ESCALATED)。');

    // 刷新列表状态
    await fetchConversations();

    // 自动打开聊天窗口
    const updatedItem = conversations.value.find(c => c.id === item.id) || { ...item, status: 'ESCALATED' };
    // 确保 chat user 字段存在
    updatedItem.user = updatedItem.user || { username: '未知用户', studentId: '--' };
    // 【修正】为了在 modal header 中能显示 userId，我们在这里填充它
    if (!updatedItem.user.username) {
        updatedItem.user.username = `用户ID: ${updatedItem.userId}`;
    }
    openChatModal(updatedItem);

  } catch (error) {
    console.error("接管失败", error);
    alert('接管失败: ' + (error.message || '未知错误'));
  }
};

// 【新增点 3】结束会话逻辑
const handleEndConversation = async (item) => {
  if (!confirm(`确定要结束ID为 ${item.id} 的会话吗？这将不可逆转。`)) {
    return;
  }

  try {
    // 调用新的结束 API
    await PostEndConversation(item.id);

    alert('会话已成功结束！');

    // 刷新列表状态
    await fetchConversations();

  } catch (error) {
    console.error("结束会话失败", error);
    alert('结束会话失败: ' + (error.message || '未知错误'));
  }
};


// 打开聊天窗口 & 获取详情
const openChatModal = async (item) => {
  currentChatId.value = item.id;
// 【修正】强制使用 '用户ID: xx' 的格式，无论是否有 username
currentChatUser.value = `用户ID: ${item.userId ? item.userId : '--'}`;

  showChatModal.value = true;
  messageList.value = [];
  loadingMessages.value = true;
  isReadOnlyMode.value = item.status !== 'ESCALATED'; // 只有 ESCALATED 允许回复

  try {
    const res = await GetConversationDetail(item.id);
    messageList.value = res.messages || [];
    scrollToBottom();

    // 启动 WebSocket 订阅
    if (typeof wsService !== 'undefined' && wsService.isConnected) {
        wsService.subscribeToConversation(item.id, (message) => {
            console.log("收到新消息:", message);
            // 将新消息追加到 messageList
            if (currentChatId.value === item.id) {
                // 适配消息格式
                const newMessage = {
                    id: message.id || Date.now(),
                    content: message.content,
                    sender: message.senderType === 'USER' ? 'USER' : 'AI', // 假设后端返回 senderType
                    createdAt: message.createdAt || new Date().toISOString(),
                    // 其他字段根据实际 API 返回调整
                };
                messageList.value.push(newMessage);
                scrollToBottom();
            }
        });
    } else {
        console.warn("WebSocket 未连接，无法实时接收消息，请刷新页面重试。");
        // 降级为轮询
        startChatAutoRefresh();
    }
    
    // 启动聊天界面自动刷新 (保留轮询作为备份，防止 WebSocket 连接断开)
    // startChatAutoRefresh();
  } catch (error) {
    console.error("获取详情失败", error);
  } finally {
    loadingMessages.value = false;
  }
};

// 发送回复
const handleSendReply = async () => {
  // ... (保持不变)
  if (!replyContent.value.trim()) return;

  if (isReadOnlyMode.value) {
      alert("当前会话状态不允许回复。请确保会话处于'已升级(ESCALATED)'状态。");
      return;
  }

  sending.value = true;
  try {
    const res = await PostReply(currentChatId.value, {
      content: replyContent.value,
      messageType: "TEXT"
    });

    const newMessage = res || {
        sender: userRole.value,
        content: replyContent.value,
        createdAt: new Date().toISOString()
    };
    messageList.value.push(newMessage);

    replyContent.value = '';
    scrollToBottom();
  } catch (error) {
    alert('发送失败: ' + (error.message || '服务异常'));
  } finally {
    sending.value = false;
  }
};

const closeChatModal = () => {
  showChatModal.value = false;
  currentChatId.value = null;
  messageList.value = [];
  // 停止聊天界面自动刷新
  stopChatAutoRefresh();
  // 刷新列表，以更新会话状态
  fetchConversations();
};

// --- 工具函数 (保持不变) ---
const scrollToBottom = () => {
  nextTick(() => {
    const chatBox = document.getElementById('message-container');
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  });
};

const formatTime = (isoString, isTimeOnly = false) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isTimeOnly) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const getRiskClass = (level) => {
  switch (level) {
    case 'CRITICAL': return 'risk-severe';
    case 'HIGH': return 'risk-high';
    case 'MEDIUM': return 'risk-medium';
    default: return 'risk-low';
  }
};

const getRiskLabel = (level) => {
  switch (level) {
    case 'CRITICAL': return '严重';
    case 'HIGH': return '高';
    case 'MEDIUM': return '中';
    case 'LOW': return '低';
    default: return '低';
  }
};

// 【修正点 1】修改 getMessageClass：根据发送者判断是否是自己 (ADMIN 或 CONSULTANT)
const getMessageClass = (sender) => {
    // 如果发送者是 CONSULTANT 或 ADMIN，则视为自己的消息（放在右侧）
    if (sender === 'CONSULTANT' || sender === 'ADMIN') {
      return 'self-message';
    }
    // 否则（USER 或 AI），视为对方的消息（放在左侧）
    return 'other-message';
};

// 【修改点 2】修改 getSenderLabel：咨询师应该显示“人工咨询师”
const getSenderLabel = (sender) => {
    switch (sender) {
        case 'USER': return '学生';
        case 'AI': return 'AI助手';
        case 'CONSULTANT': return '人工咨询师';
        default: return '系统';
    }
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

/* --- 按钮样式 --- */
.action-buttons { display: flex; gap: 10px; }
.search-btn { background-color: #8c9fae; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;}
.action-btn-primary { background-color: #f5222d; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
.action-btn-primary:hover { background-color: #cf1322; }

/* --- 表格区域 --- */
.conversation-table-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.status-select {
    border: 1px solid #d9d9d9;
    padding: 5px 10px;
    border-radius: 4px;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  font-size: 14px;
}

.data-table th, .data-table td {
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
  background-color: #fff1f0 !important;
  border: 2px solid #ff7875;
  animation: pulse 1.5s infinite alternate;
}
.risk-severe-row td { background-color: #fff1f0; }

@keyframes pulse {
  from { box-shadow: 0 0 5px rgba(245, 34, 45, 0.2); }
  to { box-shadow: 0 0 12px rgba(245, 34, 45, 0.6); }
}

/* 风险标签 */
.risk-tag {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 12px;
  color: white;
}
.risk-low { background-color: #52c41a; }
.risk-medium { background-color: #faad14; }
.risk-high { background-color: #ff4d4f; }
.risk-severe { background-color: #f5222d; border: 1px solid white; }

/* 状态文字 */
.status-escalated { color: #f5222d; font-weight: bold; }
.status-active { color: #52c41a; }
.status-completed { color: #bfbfbf; }

/* 操作按钮 */
.action-btn {
  padding: 6px 12px;
  margin-right: 5px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: white;
  border: none;
}
.takeover-btn { background-color: #fa8c16; } /* 橙色 接管 */
.takeover-btn:hover { background-color: #d46b08; }

.chat-btn { background-color: #1890ff; } /* 蓝色 沟通 */
.chat-btn:hover { background-color: #096dd9; }

.view-btn { background-color: #8c8c8c; }

/* 【新增点 4】结束会话样式 */
.end-btn {
  background-color: #8c8c8c; /* 灰色 结束 */
  margin-left: 5px;
}
.end-btn:hover {
  background-color: #595959;
}


.student-id { color: #096dd9; font-size: 14px;  }
.no-action-text { color: #ccc; font-size: 12px; }
.empty-text { text-align: center; color: #999; padding: 30px; }

/* --- 分页 --- */
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; align-items: center; gap: 10px; }
.pagination button { padding: 5px 10px; cursor: pointer; }

/* --- 实时聊天模态框 --- */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.chat-modal {
  background: white;
  padding: 0;
  border-radius: 10px;
  width: 700px;
  height: 80vh;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
    padding: 15px 20px;
    background: #f7f9fa;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.modal-header h3 { margin: 0; color: #3b5998; font-size: 18px; }
.close-icon { border: none; background: transparent; font-size: 24px; cursor: pointer; color: #999; }

.chat-box {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f5f7fa;
}

.messages {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.loading-text { text-align: center; color: #999; margin-top: 20px; }

.message {
  padding: 12px 15px;
  border-radius: 8px;
  max-width: 80%;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
}
/* 【修改点 3.1】 其他人的消息 (左侧：用户/AI) */
.other-message {
  align-self: flex-start;
  background-color: #fff; /* 白色气泡 */
  border: 1px solid #e8e8e8;
  color: #595959;
  border-top-left-radius: 0;
}
/* 【修改点 3.2】 自己的消息 (右侧：咨询师/管理员) */
.self-message {
  align-self: flex-end;
  background-color: #e6f7ff; /* 浅蓝色气泡 */
  border: 1px solid #bae7ff;
  color: #1890ff;
  border-top-right-radius: 0;
}



.msg-sender { font-size: 12px; margin-bottom: 5px; color: #999; display: flex; justify-content: space-between; gap: 10px; }

.input-area {
  display: flex;
  padding: 15px;
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
  padding: 10px 20px;
  background-color: #3b5998;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.send-btn:disabled { background-color: #ccc; cursor: not-allowed; }
</style>
