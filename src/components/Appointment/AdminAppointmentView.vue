<template>
  <div class="admin-appointment-view">

    <!-- <div class="stats-cards">
      <div class="stat-card pending">
        <div class="card-body">
          <h4 class="card-label">待处理预约</h4>
          <p class="card-value">8 <span class="unit">笔</span></p>
        </div>
        <i class="icon-placeholder pending-icon"></i>
      </div>

      <div class="stat-card confirmed">
        <div class="card-body">
          <h4 class="card-label">今日已确认</h4>
          <p class="card-value">12 <span class="unit">人</span></p>
        </div>
        <i class="icon-placeholder confirmed-icon"></i>
      </div>

      <div class="stat-card total">
        <div class="card-body">
          <h4 class="card-label">累计预约总量</h4>
          <p class="card-value">2568 <span class="unit">笔</span></p>
        </div>
        <i class="icon-placeholder total-icon"></i>
      </div>
    </div> -->

    <div class="appointment-table-section">
      <h3 class="section-title">全部预约列表</h3>

      <div class="toolbar">
        <input type="date" v-model="filterDate" class="filter-input" title="按日期筛选">
        <select v-model="filterConsultant" class="filter-select">
          <option value="">所有咨询师</option>
          <option value="1">李心理咨询师</option>
          <option value="2">赵心理专家</option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="">所有状态</option>
          <option value="PENDING">待确认</option>
          <option value="CONFIRMED">已确认</option>
          <option value="COMPLETED">已完成</option>
          <option value="CANCELLED">已取消</option>
        </select>
        <button class="search-btn" @click="search">筛选/刷新</button>
        <button class="export-btn">导出列表</button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户 (学号/ID)</th>
            <th>咨询师</th>
            <th>预约日期/时段</th>
            <th>状态</th>
            <th>用户备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in appointmentsList" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ item.user }}</td>
            <td>{{ item.consultant }}</td>
            <td>{{ item.createdAt.replace('T', ' ') }}</td>
            <td><span class="status-tag status-pending" v-if="item.status == 'PENDING'">待确认</span>
              <span class="status-tag status-confirmed" v-if="item.status == 'CONFIRMED'">已确认</span>
              <span class="status-tag status-completed" v-if="item.status == 'COMPLETED'">已完成</span>
              <span class="status-tag status-cancelled" v-if="item.status == 'CANCELLED'">已拒绝</span>

            </td>
            <td>{{ item.userNotes }}</td>
            <td>
              <!-- <button class="action-btn view-btn" @click="viewInfo(item.id)">查看</button> -->
              <button class="action-btn force-reject-btn" @click="handleForceReject(item.id)" v-if="item.status !== 'CANCELLED'">强制拒绝</button>
            </td>
          </tr>
          <!-- <tr>
            <td>1003</td>
            <td>李华 (100000004)</td>
            <td>王资深咨询师</td>
            <td>2025-11-06 16:00-17:00</td>
            <td><span class="status-tag status-confirmed">已确认</span></td>
            <td>关于学业压力</td>
            <td>
              <button class="action-btn view-btn" @click="viewInfo(1022)">查看</button>
              <button class="action-btn force-reject-btn" @click="handleForceReject(1003)">强制拒绝</button>
            </td>
          </tr>
          <tr>
            <td>1002</td>
            <td>张丽 (100000003)</td>
            <td>赵心理专家</td>
            <td>2025-11-04 14:00-15:00</td>
            <td><span class="status-tag status-completed">已完成</span></td>
            <td>无</td>
            <td><button class="action-btn view-btn" @click="viewInfo(2301)">查看</button></td>
          </tr> -->
        </tbody>
      </table>

      <div class="pagination">
        <button :disabled='appointmentsForm.page === 1' @click='reduce'>&lt;</button>
        <span>第 {{ appointmentsForm.page }} 页 / 共 {{ total }} 页</span>
        <button @click='add' :disabled='appointmentsForm.page === total'>&gt;</button>
      </div>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" :title="title" width="500" :before-close="handleClose">
    <el-form :model="reasonForm" label-width="auto" style="max-width: 600px">
      <el-form-item label="拒绝原因">
        <el-input v-model="reasonForm.reason" placeholder="请输入拒绝原因"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { GetAppointments, PutappointmentIdStatus } from '@/api/appointments'
const filterStatus = ref('');
const filterDate = ref('');
const filterConsultant = ref('');
const total = ref(10);
const title = ref('');
const dialogVisible = ref(false);
const appointmentsForm = ref({
  page: 1,
  size: 10,
  status: '',
  date: '',
  consultant: '',
});

const appointmentsList = ref([])
const getAppointmentsList = async () => {
  // 这里调用实际的 API 获取预约列表
  await GetAppointments(appointmentsForm.value).then((res) => {
    console.log(res);
    appointmentsList.value = res.list
    total.value = res.pagination.pages
  })
  // 处理响应数据
};
getAppointmentsList();


const reasonForm = ref({
  id: '',
  reason: ''
})
const handleForceReject = (id) => {
  // 实际操作：弹出模态框要求输入拒绝原因
  title.value = `强制拒绝预约`;
  dialogVisible.value = true;
  reasonForm.value.id = id;
};

// ... 其他逻辑和 API 调用
const viewInfo = (id) => {
  alert(`查看id为${id}的预约信息，待开发，因为后端没有接口`);
}
const search = () => {
  appointmentsForm.value.page = 1;
  alert("搜索功能待开发，因为后端没有接口")
}
const reduce = () => {
  appointmentsForm.value.page--;
}
const add = () => {
  appointmentsForm.value.page++;
}

const onSubmit = async () => {
  await PutappointmentIdStatus(reasonForm.value.id, reasonForm.value).then(() => {
    alert("预约已拒绝")
    dialogVisible.value = false;
    getAppointmentsList();
  })
}
</script>

<style scoped>
/* ************************************************* */
/* *************** ADMIN 预约视图样式 *************** */
/* ************************************************* */

/* --- 统计卡片布局 (与 DashboardPage 样式类似) --- */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* 调整为3列 */
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background: white;
}

.card-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 5px;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
}

.card-value .unit {
  font-size: 16px;
  font-weight: normal;
  margin-left: 5px;
}

/* 颜色主题 */
.pending {
  background-color: #fffbe6;
}

.pending .card-value {
  color: #faad14;
}

.pending-icon {
  background-color: #faad14;
}

.confirmed {
  background-color: #e6fffb;
}

.confirmed .card-value {
  color: #13c2c2;
}

.confirmed-icon {
  background-color: #13c2c2;
}

.total {
  background-color: #f0f5ff;
}

.total .card-value {
  color: #3b5998;
}

.total-icon {
  background-color: #3b5998;
}

.icon-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  opacity: 0.2;
}


/* --- 表格区域 --- */
.appointment-table-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 20px;
  color: #3b5998;
  margin-bottom: 15px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

/* 工具栏 */
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.filter-select,
.filter-input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  height: 38px;
}

.search-btn,
.export-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  height: 38px;
}

.search-btn {
  background-color: #3b5998;
}

.export-btn {
  background-color: #13c2c2;
}


/* 表格样式 */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background-color: #fafafa;
  font-weight: 600;
  color: #333;
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  color: white;
  font-size: 12px;
}

.status-pending {
  background-color: #faad14;
}

.status-confirmed {
  background-color: #1890ff;
}

.status-completed {
  background-color: #52c41a;
}

.status-cancelled {
  background-color: #f5222d;
}

/* 操作按钮 */
.action-btn {
  padding: 6px 10px;
  margin-right: 5px;
  border: 1px solid;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.view-btn {
  color: #1890ff;
  border-color: #1890ff;
  background: white;
}

.force-reject-btn {
  color: white;
  background-color: #f5222d;
  border-color: #f5222d;
}

.view-btn:hover {
  background-color: #e6f7ff;
}

.force-reject-btn:hover {
  background-color: #ff4d4f;
}


/* 分页 */
.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}
</style>
