<template>
  <div class="consultant-view">
    <div class="stats-cards">
      <div class="stat-card total-appointments">
        <div class="card-body">
          <h4 class="card-label">待处理预约</h4>
          <p class="card-value">
            {{ dashboardList?.pendingAppointments || 0 }} <span class="unit">个</span>
          </p>
        </div>
        <i class="icon-placeholder pending-icon">📅</i>
      </div>

      <div class="stat-card active-schedule-days">
        <div class="card-body">
          <h4 class="card-label">本周排班天数</h4>
          <p class="card-value">
            {{ dashboardList?.weekAppointments }}<span class="unit">天</span>
          </p>
        </div>
        <i class="icon-placeholder schedule-icon">🕑</i>
      </div>

      <div class="stat-card total-clients">
        <div class="card-body">
          <h4 class="card-label">我的服务人数</h4>
          <p class="card-value">
            {{ dashboardList?.totalClients || 0 }} <span class="unit">人</span>
          </p>
        </div>
        <i class="icon-placeholder client-icon">👥</i>
      </div>

      <div class="stat-card completed-sessions">
        <div class="card-body">
          <h4 class="card-label">已完成会谈</h4>
          <p class="card-value">
            {{ dashboardList?.totalAppointments || 0 }} <span class="unit">次</span>
          </p>
        </div>
        <i class="icon-placeholder completed-icon">✅</i>
      </div>
    </div>

    <div class="consultant-area-section">
      <h3 class="section-title">我的预约列表</h3>

      <div class="schedule-controls">
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索用户或日期..."
          class="search-input"
        />

        <select v-model="filterStatus" class="filter-select">
          <option value="">所有状态</option>
          <option value="PENDING">待确认</option>
          <option value="CONFIRMED">已确认</option>
          <option value="COMPLETED">已完成</option>
          <option value="CANCELLED">已取消</option>
        </select>

        <button class="search-btn" @click="fetchMyAppointments">查询</button>
        <button @click="handleManageSchedule" class="action-btn-primary">🗓️ 排班管理</button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>预约ID</th>
            <th>预约学生</th>
            <th>日期与时间</th>
            <th>预约主题</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in consultantList" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ item.user }}</td>
            <td>{{ item.createdAt?.replace("T", " ") }}</td>
            <td>{{ item.userNotes }}</td>
            <td>
              <span class="status-tag status-pending" v-if="item.status === 'PENDING'">待确认</span>
              <span class="status-tag status-confirmed" v-if="item.status === 'CONFIRMED'">已确认</span>
              <span class="status-tag status-completed" v-if="item.status === 'COMPLETED'">已完成</span>
              <span class="status-tag status-cancelled" v-if="item.status === 'CANCELLED'">已取消</span>

            </td>
            <td>
              <div  v-if="item.status === 'PENDING'">
              <button class="action-btn confirm-btn" @click="handleConfirm(item.id)">确认</button>
              <button class="action-btn cancel-btn" @click="handleCancel(item.id)">取消</button>
            </div>
            <div  v-if="item.status === 'CONFIRMED'">
              <button class="action-btn complete-btn" @click="handleComplete(item.id)">完成</button>
              <button class="action-btn view-btn" @click="handleView(item.id)">详情</button>
            </div>
            <button class="action-btn view-btn" @click="handleView(item.id)" v-if="item.status === 'COMPLETED' || item.status === 'CANCELLED'">查看记录</button>
            </td>

          </tr>
          <!-- <tr>
            <td>A002</td>
            <td>王小明 (100000002)</td>
            <td>2025-11-16 14:00</td>
            <td>人际关系</td>
            <td><span class="status-tag status-confirmed">已确认</span></td>
            <td>
              <button class="action-btn complete-btn" @click="handleComplete(2)">完成</button>
              <button class="action-btn view-btn" @click="handleView(2)">详情</button>
            </td>
          </tr>
          <tr>
            <td>A003</td>
            <td>赵同学 (100000005)</td>
            <td>2025-11-17 16:00</td>
            <td>情绪困扰</td>
            <td><span class="status-tag status-completed">已完成</span></td>
            <td>
              <button class="action-btn view-btn" @click="handleView(3)">查看记录</button>
            </td>
          </tr> -->
        </tbody>
      </table>
      <div class="pagination">...</div>
    </div>

    <div v-if="showScheduleModal" class="modal-overlay">
      <div class="schedule-modal">
        <h3 class="modal-title">🗓️ 个人排班设置</h3>

        <div class="schedule-form">
          <div class="form-group">
            <label for="schedule-date">选择日期</label>
            <input type="date" id="schedule-date" v-model="scheduleForm.scheduleDate" class="form-input" />
          </div>

          <div class="form-group time-slots">
            <label>时间段 (每 60 分钟一个预约)</label>
            <div class="time-inputs-wrapper">
              <input type="time" v-model="scheduleForm.startTime" class="form-input time-input" />
              <span>至</span>
              <input type="time" v-model="scheduleForm.endTime" class="form-input time-input" />
            </div>
          </div>

          <div class="form-group">
            <label for="slot-count">最大预约数/时段</label>
            <input
              type="number"
              id="slot-count"
              v-model="scheduleForm.maxAppointments"
              min="1"
              class="form-input"
            />
          </div>

          <div class="current-schedule-display">
            <h4>当前已排班列表：</h4>
            <ul>
              <li v-for="(item,index) in scheduleList" :key="index">
{{item.date}} <span v-for="(slot,idx) in item.timeSlots" :key="idx">{{slot}}</span> ({{item.timeSlots?.length || 0}}个时段)
                <!-- <span class="delete-slot" @click="deleteSchedule(index)">X</span> -->
              </li>



            </ul>
          </div>
        </div>

        <div class="modal-actions">
          <button class="modal-btn save-btn" @click="saveSchedule">保存并发布排班</button>
          <button class="modal-btn close-btn" @click="closeScheduleModal">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { GetConsultant } from "@/api/dashboard";
import { GetConsultantList,putConsultantAppointmentStatus,PostAddSchedule,GetScheduleList } from "@/api/consultant";
import { ElMessage } from "element-plus";
import {useUserStore} from '@/stores/user'

const userStats =useUserStore()
const dashboardList = ref();
const form = ref({
  page: 1,
  size: 10000,
});
const getConsultant = async () => {
  try {
    const res = await GetConsultant();
    console.log(res);
    dashboardList.value = res;
  } catch (error) {
    console.error("获取咨询师数据失败:", error);
  }
};
getConsultant();
const consultantList = ref([]);
const getConsultantList = async () => {
  const res = await GetConsultantList(form.value);
  console.log(res);
  consultantList.value = res.list;
};
getConsultantList();
// 模态框和表单数据
const showScheduleModal = ref(false);
const scheduleForm = ref({
  scheduleDate: new Date().toISOString().split("T")[0],
  startTime: "09:00",
  endTime: "17:00",
  maxAppointments: 1,
});

// 列表筛选
const searchKeyword = ref("");
const filterStatus = ref("");

// --- 预约列表方法 ---
const fetchMyAppointments = () => {
  getConsultantList();
};
// const handleExportAppointments = () => {
//   console.log("[UI] 导出预约列表");
// };
const handleConfirm = async(id) => {
  await putConsultantAppointmentStatus(id,'CONFIRMED')
  getConsultantList();

};
const handleCancel = async(id) => {
  await putConsultantAppointmentStatus(id,'CANCELLED')
  getConsultantList();

};
const handleComplete = async(id) => {
  await putConsultantAppointmentStatus(id,'COMPLETED')
  getConsultantList();

};
const handleView = (id) => {
  console.log(`[UI] 查看预约详情 ID: ${id}`);
  alert(`查看id为${id}的预约详情，待开发，因为后端没有接口`)
};

// --- 排班管理方法 ---
const scheduleList = ref([])
const handleManageSchedule = async() => {
  showScheduleModal.value = true;
  await GetScheduleList(userStats.id).then((res)=>{
    console.log(res);
    console.log(res.availableSchedules);
    scheduleList.value = res.availableSchedules
  })
};
const closeScheduleModal = () => {
  showScheduleModal.value = false;
};
const saveSchedule = async() => {
  console.log(`[API] 提交排班：POST /consultant/schedule/add`, scheduleForm.value);
  // API 参考：POST /consultant/schedule/add
  await PostAddSchedule(scheduleForm.value);
  ElMessage.success("排班成功");
  closeScheduleModal();
  getConsultantList();
};
// const deleteSchedule = async(index) => {
//   console.log(index);

//   console.log(`[API] 删除排班 ID: ${index}`);
//   // API 参考：DELETE /consultant/schedule/{id}
//   await DeleteSchedule(index);
//   ElMessage.success("排班删除成功");
//   await handleManageSchedule();
// };
</script>

<style scoped>
/* ************************************************* */
/* *************** ConsultantAppointmentView 核心样式 ****************** */
/* ************************************************* */

/* --- 区域容器样式 --- */
.consultant-area-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-top: 25px;
}

.section-title {
  font-size: 20px;
  color: #2c3e50;
  margin-bottom: 20px;
  border-left: 4px solid #3b5998;
  padding-left: 10px;
  font-weight: 600;
}

/* --- 统计卡片布局 (卡片样式与颜色主题) --- */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  background: white;
  border-left: 5px solid;
}

.card-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
  font-weight: 500;
}

.card-value {
  font-size: 36px;
  font-weight: 800;
}

.card-value .unit {
  font-size: 18px;
  font-weight: normal;
  margin-left: 5px;
  opacity: 0.8;
}

.icon-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 颜色主题 */
.total-appointments {
  border-color: #f5222d;
}

.total-appointments .card-value {
  color: #f5222d;
}

.pending-icon {
  background-color: #f5222d;
}

.active-schedule-days {
  border-color: #13c2c2;
}

.active-schedule-days .card-value {
  color: #13c2c2;
}

.schedule-icon {
  background-color: #13c2c2;
}

.total-clients {
  border-color: #3b5998;
}

.total-clients .card-value {
  color: #3b5998;
}

.client-icon {
  background-color: #3b5998;
}

.completed-sessions {
  border-color: #52c41a;
}

.completed-sessions .card-value {
  color: #52c41a;
}

.completed-icon {
  background-color: #52c41a;
}

/* --- 排班和操作控制 (列表筛选和按钮) --- */
.schedule-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
}

.search-input,
.filter-select {
  padding: 10px 15px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  height: 40px;
}

.search-input {
  width: 220px;
}

.action-btn-primary {
  background-color: #13c2c2;
}

/* 排班管理按钮 */
.search-btn {
  background-color: #3b5998;
}

/* --- 表格样式 --- */
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  font-size: 14px;
  margin-top: 15px;
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

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
  color: white;
}

.status-pending {
  background-color: #faad14;
}

.status-confirmed {
  background-color: #13c2c2;
}

.status-completed {
  background-color: #52c41a;
}

.status-cancelled {
  background-color: #bfbfbf;
}

/* 表格操作按钮 */
.action-btn {
  padding: 8px 12px;
  margin-right: 5px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: white;
}

.confirm-btn {
  background-color: #52c41a;
}

.cancel-btn {
  background-color: #f5222d;
}

.complete-btn {
  background-color: #1890ff;
}

.view-btn {
  background-color: #8c9fae;
}

/* ************************************************* */
/* *************** 美化后的排班表单 (模态框) 样式 ****************** */
/* ************************************************* */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.schedule-modal {
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 550px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
}

.modal-title {
  color: #3b5998;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 15px;
  margin-top: 0;
  font-size: 24px;
}

/* 表单布局和样式 */
.schedule-form {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-input:focus {
  border-color: #13c2c2;
  outline: none;
  box-shadow: 0 0 0 2px rgba(19, 194, 194, 0.2);
}

.time-slots {
  display: flex;
  flex-direction: column;
}

.time-inputs-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-input {
  width: 150px;
  flex-grow: 0;
}

.time-inputs-wrapper span {
  color: #666;
  font-size: 16px;
}

/* 当前排班列表 */
.current-schedule-display {
  background-color: #f7f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #eee;
  margin-top: 25px;
}

.current-schedule-display h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #3b5998;
}

.current-schedule-display ul {
  list-style: none;
  padding: 0;
}

.current-schedule-display li {
  padding: 8px 0;
  font-size: 14px;
  color: #595959;
  border-bottom: 1px dashed #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-schedule-display li:last-child {
  border-bottom: none;
}

.delete-slot {
  color: #f5222d;
  cursor: pointer;
  font-weight: bold;
  margin-left: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.delete-slot:hover {
  background-color: #fff1f0;
}

/* 模态框底部动作按钮 */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

.modal-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
}

.save-btn {
  background-color: #52c41a;
  color: white;
}

.save-btn:hover {
  background-color: #389e0d;
}

.close-btn {
  background-color: #d9d9d9;
  color: #333;
}

.close-btn:hover {
  background-color: #bfbfbf;
}
</style>
