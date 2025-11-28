<template>
  <div class="consultant-view">
    <div class="stats-cards">
      <div class="stat-card total-appointments">
        <div class="card-body">
          <h4 class="card-label">待确认预约</h4>
          <p class="card-value">
            {{ dashboardList?.pendingAppointments || 0 }} <span class="unit">个</span>
          </p>
        </div>
        <i class="icon-placeholder pending-icon">📅</i>
      </div>

      <div class="stat-card active-schedule-days">
        <div class="card-body">
          <h4 class="card-label">本周已预约</h4>
          <p class="card-value">
            {{ dashboardList?.weekAppointments || 0 }}<span class="unit">次</span>
          </p>
        </div>
        <i class="icon-placeholder schedule-icon">🕑</i>
      </div>

      <div class="stat-card total-clients">
        <div class="card-body">
          <h4 class="card-label">总服务人数</h4>
          <p class="card-value">
            {{ dashboardList?.totalClients || 0 }} <span class="unit">人</span>
          </p>
        </div>
        <i class="icon-placeholder client-icon">👥</i>
      </div>

      <div class="stat-card completed-sessions">
        <div class="card-body">
          <h4 class="card-label">总完成会谈</h4>
          <p class="card-value">
            {{ dashboardList?.totalAppointments || 0 }} <span class="unit">次</span>
          </p>
        </div>
        <i class="icon-placeholder completed-icon">✅</i>
      </div>
    </div>

    <div class="appointment-section">
      <h3 class="section-title">我的预约列表</h3>

      <div class="controls">
        <select v-model="filterForm.status" class="filter-select">
          <option value="">所有状态</option>
          <option value="PENDING">待确认</option>
          <option value="CONFIRMED">已确认</option>
          <option value="COMPLETED">已完成</option>
          <option value="CANCELLED">已取消</option>
          <option value="REJECTED">已拒绝</option>
        </select>

        <input type="text" v-model="filterForm.searchKeyword" placeholder="输入用户姓名/学号关键词" class="search-input">

        <button class="search-btn" @click="fetchAppointments">查询/刷新</button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>预约用户</th>
            <th>预约日期</th>
            <th>时间段</th>
            <th>状态</th>
            <th>用户备注</th>
            <th width="220">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in appointmentList" :key="item.id">
            <td>{{ index + 1 + (pagination.page - 1) * pagination.size }}</td>
            <td>{{ item.user?.realName || item.user?.username || `ID:${item.userId}` }}</td>
            <td>{{ item.appointmentDate }}</td>
            <td>{{ item.startTime }} - {{ item.endTime }}</td>
            <td>
              <span :class="['status-tag', getStatusClass(item.status)]">
                {{ getStatusLabel(item.status) }}
              </span>
            </td>
            <td class="notes-cell" :title="item.userNotes">{{ item.userNotes || '--' }}</td>
            <td>
              <template v-if="item.status === 'PENDING'">
                <button
                  class="action-btn accept-btn"
                  @click="handleAppointmentReview(item.id, 'CONFIRM')"
                >
                  接受
                </button>
                <button
                  class="action-btn reject-btn"
                  @click="handleAppointmentReview(item.id, 'CANCEL')"
                >
                  拒绝
                </button>
              </template>

              <template v-else-if="item.status === 'CONFIRMED'">
                <button
                  class="action-btn complete-btn"
                  @click="handleUpdateStatus(item.id, 'COMPLETED')"
                >
                  标记完成
                </button>
                <button
                  class="action-btn cancel-btn"
                  @click="handleUpdateStatus(item.id, 'CANCELLED')"
                >
                  取消预约
                </button>
              </template>

              <span v-else>--</span>
            </td>
          </tr>
          <tr v-if="appointmentList.length === 0">
            <td colspan="7" style="text-align: center; padding: 20px; color: #999;">暂无预约数据</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button :disabled="pagination.page <= 1" @click="changePage(-1)">上一页</button>
        <span style="margin: 0 10px;">第 {{ pagination.page }} / {{ Math.ceil(pagination.total / pagination.size) || 1 }} 页</span>
        <button :disabled="pagination.page * pagination.size >= pagination.total" @click="changePage(1)">下一页</button>
      </div>
    </div>

    <div class="schedule-section">
      <h3 class="section-title">我的排班管理</h3>

      <div class="add-schedule-form">
        <h4 class="form-title">添加新的排班时间</h4>
        <div class="form-row">
          <label>日期:</label>
          <input type="date" v-model="scheduleForm.scheduleDate" class="date-input" />
        </div>
        <div class="form-row time-inputs-wrapper">
          <label>时间:</label>
          <input type="time" v-model="scheduleForm.startTime" class="time-input" />
          <span>至</span>
          <input type="time" v-model="scheduleForm.endTime" class="time-input" />
        </div>
        <div class="form-row">
          <label>最大预约数:</label>
          <input type="number" v-model.number="scheduleForm.maxAppointments" class="number-input" min="1" max="10" />
        </div>
        <button class="add-schedule-btn" @click="handleAddSchedule">添加排班</button>
      </div>

      <div class="current-schedule-display">
        <h4>当前已设置排班 (筛选):</h4>

        <div class="form-row schedule-filter-row">
            <label>筛选日期:</label>
            <input type="date" v-model="scheduleFilter.startDate" class="date-input" style="max-width: 150px;" />
            <span>至</span>
            <input type="date" v-model="scheduleFilter.endDate" class="date-input" style="max-width: 150px;" />
            <button class="search-btn" @click="fetchSchedules" style="margin-left: 10px;">筛选/刷新</button>
        </div>
        <p v-if="!currentConsultantId" style="color: #f5222d;">正在获取咨询师ID...</p>
        <ul v-else-if="scheduleList.length > 0">
          <li v-for="slot in scheduleList" :key="slot.id">
            <span>{{ slot.date }} ({{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}) [限 {{ slot.maxAppointments }} 人]</span>
            <span class="delete-slot" @click="handleDeleteSchedule(slot.id)">[删除]</span>
          </li>
        </ul>
        <p v-else style="color: #999;">暂无排班记录。</p>
      </div>

    </div>

    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

// 导入 API 函数 (从 consultant.js)
import {
  GetCurrentConsultantId,
  GetConsultantList,
  PutReviewAppointment,
  PutUpdateStatus,
  PostAddSchedule,
  GetConsultantSchedules,
  DeleteSchedule,
} from "@/api/consultant";

// 导入 API 函数 (从 dashboard.js)
import { GetConsultant } from "@/api/dashboard";

// --- 状态变量 ---
const currentConsultantId = ref(null);
const dashboardList = ref({}); // 仪表盘数据
const appointmentList = ref([]);
const scheduleList = ref([]);

const filterForm = reactive({
  status: '',
  searchKeyword: '',
});
const pagination = reactive({ page: 1, size: 10, total: 0 });

const scheduleForm = reactive({
  scheduleDate: '',
  startTime: '09:00',
  endTime: '17:00',
  maxAppointments: 1,
});

// 【更新逻辑】计算默认日期范围：前30天 到 后30天
const today = new Date();

// 1. 设置开始日期默认为今天的 30 天前
const startDateCalc = new Date(today);
startDateCalc.setDate(today.getDate() - 30); // 减去 30 天
const startDateDefault = startDateCalc.toISOString().split('T')[0];

// 2. 设置结束日期默认为今天的 30 天后
const endDateCalc = new Date(today);
endDateCalc.setDate(today.getDate() + 30); // 加上 30 天
const endDateDefault = endDateCalc.toISOString().split('T')[0];

// 排班列表筛选表单
// 默认 startDate 为今天的30天前，endDate 为今天的30天后
const scheduleFilter = reactive({
    startDate: startDateDefault,
    endDate: endDateDefault
})


// --- 生命周期 ---
onMounted(async () => {
  await fetchConsultantId();
  if (currentConsultantId.value) {
      // 加载仪表盘数据
      fetchDashboardData();
      // 加载预约列表
      fetchAppointments();
      // 【恢复自动调用】一进入页面就使用默认日期（30天前至今天）加载排班列表
      fetchSchedules();
  }
});

// --- 获取咨询师ID ---
const fetchConsultantId = async () => {
    try {
        const id = await GetCurrentConsultantId();
        currentConsultantId.value = id;
    } catch (error) {
        console.error("获取咨询师ID失败", error);
        ElMessage.error("初始化失败：无法获取咨询师ID");
    }
};

// --- 获取仪表盘数据 ---
const fetchDashboardData = async () => {
    try {
        const res = await GetConsultant();
        dashboardList.value = res || {};
    } catch (error) {
        console.error("获取仪表盘数据失败", error);
        ElMessage.error("获取仪表盘数据失败");
        dashboardList.value = {
            todayAppointments: 0,
            weekAppointments: 0,
            pendingAppointments: 0,
            totalAppointments: 0,
            totalClients: 0
        };
    }
}


// --- 预约列表操作 ---
const fetchAppointments = async () => {
  if (!currentConsultantId.value) {
    ElMessage.warning('Consultant ID not loaded, unable to fetch appointment list.');
    return;
  }

  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      status: filterForm.status,
      searchKeyword: filterForm.searchKeyword,
    };

    const res = await GetConsultantList(params);
    appointmentList.value = res.list || [];
    pagination.total = res.pagination?.total || 0;

  } catch (error) {
    console.error("Failed to fetch appointment list", error);
    ElMessage.error("Failed to fetch appointment list");
  }
};

const changePage = (delta) => {
  pagination.page += delta;
  fetchAppointments();
};

/**
 * 审核预约 (接受/拒绝)
 */
const handleAppointmentReview = async (appointmentId, action) => {
  const actionText = action === 'CONFIRM' ? '接受' : '拒绝';
  const type = action === 'CANCEL' ? 'warning' : 'info';

  try {
    const { value: notes } = await ElMessageBox.prompt('', `${actionText}预约确认`, {
        confirmButtonText: `确定${actionText}`,
        cancelButtonText: '取消',
        title: `${actionText}预约确认`,
        inputPlaceholder: action === 'CANCEL' ? '选填：拒绝理由' : '选填：确认备注',
        type: type
    });

    const data = {
        action: action,
        notes: notes || `咨询师已${actionText}`
    }

    await PutReviewAppointment(appointmentId, data);

    ElMessage.success(`预约已成功${actionText}！`);
    fetchAppointments(); // 刷新列表
    fetchDashboardData();
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') {
        console.error(`Appointment ${actionText} failed`, e);
        ElMessage.error(`预约${actionText}操作失败`);
    }
  }
};

/**
 * 更新预约状态 (标记完成/取消)
 */
const handleUpdateStatus = async (appointmentId, status) => {
  const actionText = status === 'COMPLETED' ? '标记完成' : '取消';
  const type = status === 'CANCELLED' ? 'warning' : 'info';

  try {
    const { value: notes } = await ElMessageBox.prompt(`确定要${actionText}这条预约吗？请填写简要备注：`, `${actionText}确认`, {
      confirmButtonText: `确定${actionText}`,
      cancelButtonText: '取消',
      type: type,
      inputPlaceholder: '选填：备注信息',
    });

    await PutUpdateStatus(appointmentId, status, notes);

    ElMessage.success(`预约状态已更新为 ${getStatusLabel(status)}！`);
    fetchAppointments(); // 刷新列表
    fetchDashboardData();
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') {
        console.error(`Failed to update status`, e);
        ElMessage.error(`更新状态操作失败`);
    }
  }
};


// --- 排班管理操作 ---

const fetchSchedules = async () => {
    if (!currentConsultantId.value) {
        ElMessage.warning('咨询师ID未加载，无法获取排班列表。');
        return;
    };

    try {
        // 使用 scheduleFilter 中的 startDate 和 endDate 作为 API 参数
        const params = {};
        // 确保 API 必须的参数都存在
        if (scheduleFilter.startDate) params.startDate = scheduleFilter.startDate;
        if (scheduleFilter.endDate) params.endDate = scheduleFilter.endDate;

        // 【修正】调用 API 时传入参数
        const res = await GetConsultantSchedules(currentConsultantId.value, params);

        let list = res.list ? res.list : (Array.isArray(res) ? res : []);

        // 【关键修复】：使用 API 返回的 'date' 字段进行升序排序
        scheduleList.value = list.sort((a,b) => new Date(a.date) - new Date(b.date));

    } catch (error) {
        console.error("获取排班列表失败", error);
        ElMessage.error('获取排班列表失败，请检查日期格式或网络连接。');
    }
};
const handleAddSchedule = async () => {
    const { scheduleDate, startTime, endTime, maxAppointments } = scheduleForm;
    if (!scheduleDate || !startTime || !endTime || !maxAppointments) {
        ElMessage.warning('请填写完整的排班信息！');
        return;
    }
    if (startTime >= endTime) {
        ElMessage.warning('开始时间必须早于结束时间！');
        return;
    }

    try {
      // 【关键修改】：确保时间字段包含秒 (:00)，防止后端因为缺少秒数而报错
        const formattedStartTime = startTime.includes(':00') ? startTime : `${startTime}:00`;
        const formattedEndTime = endTime.includes(':00') ? endTime : `${endTime}:00`;
        await PostAddSchedule({
            // 注意：API 添加排班时日期字段为 scheduleDate
            scheduleDate: scheduleDate,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            maxAppointments: maxAppointments
        });
        ElMessage.success('排班添加成功！');

        // 清空并重置表单
        scheduleForm.scheduleDate = '';
        scheduleForm.startTime = '09:00';
        scheduleForm.endTime = '17:00';
        scheduleForm.maxAppointments = 1;

        // 添加排班成功后，自动使用当前筛选条件刷新排班列表
        fetchSchedules();
    }catch (error) {
        console.error("添加排班失败", error);
        ElMessage.error(`添加排班失败: ${error.message || '未知错误'}`);
    }
};

const handleDeleteSchedule = async (scheduleId) => {
    try {
        await ElMessageBox.confirm('确定要删除这条排班记录吗？删除后将无法被用户预约。', '删除确认', {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'error'
        });

        await DeleteSchedule(scheduleId);
        ElMessage.success('排班删除成功！');
        fetchSchedules(); // 刷新列表
    } catch (e) {
        if (e !== 'cancel' && e !== 'close') {
             console.error("删除排班失败", e);
             ElMessage.error("删除排班操作失败");
        }
    }
};


// --- 工具函数 ---
const getStatusClass = (status) => {
  const map = {
    'PENDING': 'status-pending',
    'CONFIRMED': 'status-confirmed',
    'COMPLETED': 'status-completed',
    'CANCELLED': 'status-cancelled',
    'REJECTED': 'status-rejected',
  };
  return map[status] || '';
};

const getStatusLabel = (status) => {
  const map = {
    'PENDING': '待确认',
    'CONFIRMED': '已确认',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消',
    'REJECTED': '已拒绝',
  };
  return map[status] || status;
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
}
</script>

<style scoped>
/* 视图布局 */
.consultant-view {
  padding: 20px;
}
.appointment-section, .schedule-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-top: 25px;
}
.section-title {
  font-size: 22px;
  color: #3b5998;
  margin-bottom: 25px;
  font-weight: 700;
  border-left: 5px solid #3b5998;
  padding-left: 10px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
.stat-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 5px solid #eee;
}
.total-appointments { border-left-color: #fadb14; }
.active-schedule-days { border-left-color: #3b5998; }
.total-clients { border-left-color: #1890ff; }
.completed-sessions { border-left-color: #52c41a; }

.card-value { font-size: 28px; font-weight: bold; margin: 5px 0 0 0; color: #2c3e50; }
.card-label { font-size: 14px; color: #666; margin: 0; }
.unit { font-size: 14px; font-weight: normal; color: #999; margin-left: 5px;}
.icon-placeholder { font-size: 30px; font-style: normal; opacity: 0.7;}

/* 筛选与表格 */
.controls { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; }
.filter-select { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; }
.search-input { padding: 8px 12px; border: 1px solid #d9d9d9; border-radius: 4px; width: 250px; }
.search-btn { background-color: #3b5998; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
.search-btn:hover { background-color: #2b457e; }

.data-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; font-size: 14px; }
.data-table th { background-color: #f7f9fa; padding: 15px; text-align: left; color: #333; }
.data-table td { background-color: #fff; padding: 15px; border-bottom: 1px solid #eee; }
.notes-cell { max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #666; }

/* 状态标签 */
.status-tag { padding: 4px 8px; border-radius: 12px; font-size: 12px; color: white; font-weight: 500;}
.status-pending { background-color: #faad14; } /* 待确认 */
.status-confirmed { background-color: #13c2c2; } /* 已确认 */
.status-completed { background-color: #52c41a; } /* 已完成 */
.status-cancelled { background-color: #bfbfbf; } /* 已取消 */
.status-rejected { background-color: #f5222d; } /* 已拒绝 */

/* 预约操作按钮 */
.action-btn { padding: 6px 10px; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 13px; margin-right: 5px; }
.accept-btn { background-color: #52c41a; }
.reject-btn { background-color: #f5222d; }
.complete-btn { background-color: #1890ff; }
.cancel-btn { background-color: #bfbfbf; }

/* 分页 */
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; align-items: center; gap: 10px; }
.pagination button { padding: 8px 15px; cursor: pointer; border: 1px solid #ddd; background: #fff; border-radius: 4px; transition: background-color 0.2s; }
.pagination button:hover:not(:disabled) { background-color: #f0f0f0; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }

/* 排班表单 */
.add-schedule-form {
    background-color: #f7f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px dashed #d9d9d9;
    margin-bottom: 25px;
}
.form-title {
    margin-top: 0;
    margin-bottom: 15px;
    color: #2c3e50;
    font-size: 18px;
}
.form-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 15px;
}
.form-row label {
    font-weight: 500;
    width: 90px;
    color: #595959;
}
.date-input, .time-input, .number-input {
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    flex-grow: 1;
    max-width: 200px;
}
.time-inputs-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-grow: 1;
}
.time-inputs-wrapper span {
    color: #666;
}
.add-schedule-btn {
    background-color: #52c41a;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
    transition: background-color 0.2s;
}
.add-schedule-btn:hover {
    background-color: #389e0d;
}

/* 当前排班列表 */
.current-schedule-display {
  background-color: #ffffff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #eee;
  margin-top: 15px;
}
.current-schedule-display h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #3b5998;
  font-size: 16px;
}
.current-schedule-display ul {
  list-style: none;
  padding: 0;
}
.current-schedule-display li {
  padding: 10px 15px;
  font-size: 14px;
  color: #595959;
  border-bottom: 1px dashed #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fafafa;
  border-radius: 4px;
  margin-bottom: 5px;
}
.current-schedule-display li:last-child {
  border-bottom: none;
}
.delete-slot {
  color: #f5222d;
  cursor: pointer;
  font-weight: 500;
  margin-left: 10px;
  transition: opacity 0.2s;
}
.delete-slot:hover {
    opacity: 0.8;
}

/* 新增的排班筛选样式（复用form-row和相关输入框样式） */
.schedule-filter-row {
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
    /* 确保日期筛选在同一行 */
    display: flex;
    align-items: center;
    gap: 15px;
}
.schedule-filter-row label {
    width: 60px;
}
</style>
