<template>
  <div class="user-management-page">
    <h2 class="page-title">用户管理中心</h2>

    <template v-if="userRole === 'CONSULTANT'">
<div class="consultant-apply-container">
        <h3 class="form-title">{{ isEditMode ? '我的咨询师档案' : '申请/完善心理咨询师信息' }}</h3>
        <div v-if="isEditMode" class="approved-tip">
           <h3><span style="margin-right:8px">✓</span>您已通过咨询师认证</h3>
           <p>修改信息并提交后，需要管理员重新审核。</p>
        </div>

        <p v-else class="form-subtitle">
          请填写您的专业信息，通过审核后您将获得相应的系统权限。
        </p>

        <el-form
          ref="consultantFormRef"
          :model="consultantForm"
          :rules="consultantRules"
          label-width="120px"
          class="consultant-form"
        >
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="consultantForm.realName" placeholder="请输入真实姓名" />
          </el-form-item>

          <el-form-item label="专业领域" prop="specialization">
            <el-input v-model="consultantForm.specialization" placeholder="例如：认知行为疗法、家庭治疗" />
          </el-form-item>

          <el-form-item label="资质证书" prop="qualification">
            <el-input v-model="consultantForm.qualification" placeholder="例如：国家二级心理咨询师证书编号" />
          </el-form-item>

          <el-form-item label="经验年限" prop="experienceYears">
            <el-input-number
              v-model="consultantForm.experienceYears"
              :min="0"
              :max="50"
              controls-position="right"
            />
            <span style="margin-left: 10px;">年</span>
          </el-form-item>

          <el-form-item label="个人简介" prop="introduction">
            <el-input
              v-model="consultantForm.introduction"
              type="textarea"
              :rows="4"
              placeholder="请详细介绍您的专业背景、擅长领域和治疗理念"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitConsultantForm">
              {{ isEditMode ? '修改并重新提交' : '提交申请' }}
            </el-button>
            <el-button @click="resetConsultantForm">
              {{ isEditMode ? '重置为当前信息' : '重置' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </template>

    <template v-else-if="userRole === 'ADMIN'">
      <el-tabs v-model="activeTab" class="user-tabs">

        <el-tab-pane label="系统用户管理" name="users">
          <div class="search-bar">
            <el-select v-model="userForm.role" placeholder="筛选角色" clearable @change="getUserList">
              <el-option label="普通学生用户" value="USER"></el-option>
              <el-option label="心理咨询师" value="CONSULTANT"></el-option>
              </el-select>

            <el-select v-model="userForm.status" placeholder="筛选状态" clearable @change="getUserList">
              <el-option label="启用" value="ACTIVE"></el-option>
              <el-option label="封禁" value="BLOCKED"></el-option>
              <el-option label="待审核" value="PENDING"></el-option>
            </el-select>

            <el-input
              v-model="userForm.keyword"
              placeholder="搜索用户名/姓名"
              style="width: 200px"
              clearable
              @keyup.enter="getUserList"
              @clear="getUserList"
            ></el-input>
            <el-button type="primary" @click="getUserList">搜索</el-button>
          </div>

          <el-table :data="userList" stripe style="width: 100%" height="calc(100vh - 350px)">
            <el-table-column type="index" label="序号" width="80" />
            <el-table-column prop="username" label="用户名" width="150" />
            <el-table-column prop="realName" label="真实姓名" width="120" />
            <el-table-column prop="email" label="邮箱" width="180" />
            <el-table-column prop="phone" label="电话" width="120" />
            <el-table-column prop="role" label="用户角色" width="120">
              <template #default="{ row }">
                <span :class="['role-tag', 'role-' + row.role.toLowerCase()]">{{ getRoleLabel(row.role) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <span :class="['status-tag', 'status-' + row.status.toLowerCase()]">{{ getStatusLabel(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="注册时间" width="180">
              <template #default="{ row }">
                {{ row.createdAt ? row.createdAt.replace('T', ' ') : '-' }}
              </template>
            </el-table-column>

<el-table-column label="操作" width="180" fixed="right">
  <template #default="{ row }">
    <button class="action-btn view-btn" @click="handleViewDetails(row)">详情</button>

    <button
      v-if="row.role === 'USER' && row.status !== 'PENDING'"
      :class="[
        'action-btn',
        'toggle-status-btn',
        // 如果是 BANNED，显示 '启用' 样式 (status-unblock)，否则显示 '封禁' 样式 (status-block)
        row.status === 'BANNED' ? 'status-unblock' : 'status-block'
      ]"
      @click="handleBlockStatus(row)"
    >
      {{ row.status === 'BANNED' ? '启用' : '封禁' }}
    </button>
  </template>
</el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              :current-page="userForm.page"
              :page-size="userForm.size"
              :total="total"
              layout="total, prev, pager, next"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane :label="`待审核咨询师 (${pendingConsultantList.length})`" name="consultant-pending">
          <el-table :data="pendingConsultantList" stripe style="width: 100%" height="calc(100vh - 350px)">
            <el-table-column type="index" label="序号" width="80" />

            <el-table-column prop="username" label="关联用户名" width="120">
               <template #default="{ row }">
                 {{ row.username || '未知用户' }}
               </template>
            </el-table-column>

            <el-table-column prop="realName" label="真实姓名" width="120" />
            <el-table-column prop="specialization" label="专业领域" show-overflow-tooltip />
            <el-table-column prop="qualification" label="资质证书" show-overflow-tooltip />
            <el-table-column prop="experienceYears" label="经验(年)" width="100" align="center" />

            <el-table-column prop="createdAtFormatted" label="申请时间" width="180">
                <template #default="{ row }">
                    {{ row.createdAtFormatted }}
                </template>
            </el-table-column>

            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <button class="action-btn view-btn" @click="openReviewDialog(row)">审核/详情</button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </template>

    <template v-else>
      <div class="permission-alert">
        <i class="fas fa-exclamation-triangle"></i>
        <span>权限不足，您没有权限查看用户管理中心。</span>
      </div>
    </template>

    <el-dialog v-model="dialogVisible" :title="title" width="40%">
      <el-form :model="dialogForm" label-width="100px">
        <el-form-item label="用户名">{{ dialogForm.username }}</el-form-item>
        <el-form-item label="真实姓名">{{ dialogForm.realName }}</el-form-item>
        <el-form-item label="角色">{{ getRoleLabel(dialogForm.role) }}</el-form-item>
        <el-form-item label="状态">{{ getStatusLabel(dialogForm.status) }}</el-form-item>
        <el-form-item label="邮箱">{{ dialogForm.email }}</el-form-item>
        <el-form-item label="电话">{{ dialogForm.phone }}</el-form-item>
        <el-form-item label="注册时间">{{ dialogForm.createdAt }}</el-form-item>
        <el-form-item label="最后登录">{{ dialogForm.lastLoginTime }}</el-form-item>
        <template v-if="dialogForm.role === 'CONSULTANT' && dialogForm.consultantInfo">
          <el-divider>咨询师信息</el-divider>
          <el-form-item label="专业领域">{{ dialogForm.consultantInfo.specialization }}</el-form-item>
          <el-form-item label="资质证书">{{ dialogForm.consultantInfo.qualification }}</el-form-item>
          <el-form-item label="经验年限">{{ dialogForm.consultantInfo.experienceYears }} 年</el-form-item>
          <el-form-item label="个人简介">{{ dialogForm.consultantInfo.introduction }}</el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

<el-dialog
      v-model="reviewDialogVisible"
      :title="`审核咨询师申请: ${currentReviewItem.realName || ''}`"
      width="40%"
      :close-on-click-modal="false"
    >
      <div class="review-details" style="margin-bottom: 20px; padding: 15px; background: #f5f7fa; border-radius: 4px;">
        <h4 style="margin-top:0; margin-bottom: 15px; color: #303133;">申请详细信息</h4>
        <el-row :gutter="20">
          <el-col :span="12"><p><b>真实姓名:</b> {{ currentReviewItem.realName }}</p></el-col>
          <el-col :span="12"><p><b>经验年限:</b> {{ currentReviewItem.experienceYears }} 年</p></el-col>
          <el-col :span="24"><p><b>专业领域:</b> {{ currentReviewItem.specialization }}</p></el-col>
          <el-col :span="24"><p><b>资质证书:</b> {{ currentReviewItem.qualification }}</p></el-col>
          <el-col :span="24">
            <p><b>个人简介:</b></p>
            <div style="background: #fff; padding: 8px; border: 1px solid #e4e7ed; border-radius: 4px; min-height: 60px;">
              {{ currentReviewItem.introduction }}
            </div>
          </el-col>
          <el-col :span="12"><p><b>申请时间:</b> {{ currentReviewItem.createdAtFormatted }}</p></el-col>
        </el-row>
      </div>

      <el-form
        ref="reviewFormRef"
        :model="reviewForm"
        label-width="80px"
      >
        <el-form-item label="审核结果" prop="action" :rules="[{ required: true, message: '请选择', trigger: 'change' }]">
          <el-radio-group v-model="reviewForm.action">
            <el-radio label="APPROVE" border>通过</el-radio>
            <el-radio label="REJECT" border style="margin-left: 10px; color: #f56c6c;">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          label="原因"
          prop="reason"
          :rules="[{ required: reviewForm.action === 'REJECT', message: '拒绝时必须填写原因', trigger: 'blur' }]"
        >
          <el-input
            v-model="reviewForm.reason"
            type="textarea"
            :rows="3"
            :placeholder="reviewForm.action === 'REJECT' ? '请输入拒绝原因' : '备注 (可选)'"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReview">确认提交</el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import {
  GetUsers, GetByUserId, PutByUserIdStatus,
  GetPendingConsultants, PutConsultantReview,
  PostConsultantUpload, CheckConsultantApproved
} from '@/api/user';
import { ElMessage, ElMessageBox } from 'element-plus';
// ----------------------------------------------------
// 【重要修改】使用 Pinia Hook 替换 Vuex Hook
// 导入 Pinia user store
import { useUserStore } from '@/stores/user.js';
import { storeToRefs } from 'pinia';
// ----------------------------------------------------

// ==================== Pinia 逻辑 ====================
// 实例化 store
const userStore = useUserStore();
// 【修改】解构 token, role, id, realName
const { role, id, realName } = storeToRefs(userStore);
const userRole = computed(() => role.value);
const userId = computed(() => id.value); // 【新增】获取当前登录用户ID // 在模板中使用 userRole.value 即可，但在 setup 中我们访问 role.value
// ==================== /Pinia 逻辑 ====================

// Tab 状态
const activeTab = ref('users');

// 监听全局事件，切换到指定标签页
const handleSwitchTab = (event) => {
  const { tab } = event.detail;
  if (tab) {
    activeTab.value = tab;
  }
};

onMounted(() => {
  window.addEventListener('switchTab', handleSwitchTab);
});

// 在组件销毁前移除事件监听
// 注意：在 Vue 3 的组合式 API 中，通常不需要手动清理事件监听器，
// 但如果需要，可以使用 onUnmounted 钩子

// 用户列表数据
const userList = ref([]);
const total = ref(0);
const userForm = reactive({
  page: 1,
  size: 10,
  role: '', // USER, CONSULTANT
  status: '', // ACTIVE, INACTIVE, PENDING
  keyword: ''
});

// 待审核咨询师列表数据 (Requirement 4)
const currentReviewItem = ref({});
const reviewDialogVisible = ref(false);
const reviewForm = ref({
  action: 'APPROVE', // 默认通过
  reason: '',
});
const reviewFormRef = ref(null);

// 详情对话框
const dialogVisible = ref(false);
const dialogForm = ref({});
const title = ref('用户详情');

// ==================== 待审核咨询师列表 (Pending Consultants) 状态 ====================
const currentReviewUser = ref({});       // 当前正在审核的用户数据
// ==================== 咨询师申请表单逻辑 (CONSULTANT 专用) ====================
const consultantFormRef = ref(null); // 表单引用
const isEditMode = ref(false); // 【新增】是否为修改模式
const consultantForm = reactive({
  realName: realName.value, // 从 Pinia 预填充真实姓名
  specialization: '',
  qualification: '',
  experienceYears: 0,
  introduction: '',
});

const consultantRules = reactive({
  realName: [
    { required: true, message: '请填写您的真实姓名', trigger: 'blur' },
  ],
  specialization: [
    { required: true, message: '请填写您的专业领域', trigger: 'blur' },
    { min: 5, message: '专业领域描述不应少于5个字符', trigger: 'blur' },
  ],
  qualification: [
    { required: true, message: '请填写您的资质证书信息', trigger: 'blur' },
  ],
  experienceYears: [
    { required: true, message: '请填写经验年限', trigger: 'change' },
  ],
  introduction: [
    { required: true, message: '请填写个人简介', trigger: 'blur' },
    { min: 20, message: '简介不应少于20个字符', trigger: 'blur' },
  ],
});

// 2. 【重写】初始化逻辑：只检查状态，不拉取数据
const initConsultantView = async () => {
  if (userRole.value !== 'CONSULTANT') return;

  try {
    // 只检查是否通过了认证
    const checkRes = await CheckConsultantApproved(userId.value);
    const isApproved = checkRes === true || checkRes?.data === true;

    if (isApproved) {
        isEditMode.value = true; // 标记为修改模式，仅用于显示提示文案
        // 【注意】这里不再调用 GetConsultants 或 GetConsultantInfo 去回显数据了
        // 表单将保持为空，等待用户输入新的信息
    }
  } catch (error) {
    console.log('检查咨询师认证状态失败', error);
  }
};

// 提交咨询师信息表单
const submitConsultantForm = async () => {
  if (!consultantFormRef.value) return;

  try {
    await consultantFormRef.value.validate();

    // 准备提交数据
    const submitData = {
      userId: userId.value,
      realName: consultantForm.realName,
      specialization: consultantForm.specialization,
      qualification: consultantForm.qualification,
      experienceYears: consultantForm.experienceYears,
      introduction: consultantForm.introduction,
    };

    // 调用上传 API (修改也用这个接口)
    await PostConsultantUpload(submitData);

    // 【修改】根据模式显示不同的提示
    if (isEditMode.value) {
        ElMessage.success('信息修改已提交，将重新进行审核。');
        // 刷新视图以确保数据同步
        initConsultantView();
    } else {
        ElMessage.success('咨询师申请提交成功！请等待系统审核。');
        resetConsultantForm();
    }

  } catch (error) {
    if (error !== false) {
      console.error('提交咨询师信息失败:', error);
      ElMessage.error('信息提交失败，请检查网络或填写内容。');
    }
  }
};

// 3. 【修改】重置表单逻辑：只清空，不重新获取
const resetConsultantForm = () => {
    if (consultantFormRef.value) {
        consultantFormRef.value.resetFields();
    }
    // 始终只保留真实姓名 (从 Pinia 获取)
    consultantForm.realName = realName.value;
};

// 【新增】在 onMounted 中调用
onMounted(() => {
  if (userRole.value === 'ADMIN') {
    getUserList();
  } else if (userRole.value === 'CONSULTANT') {
    initConsultantView(); // <--- 这一行是新增的
  }
});
// ==================== 工具函数 ====================

// 角色标签显示
const getRoleLabel = (role) => {
  switch (String(role).toUpperCase()) {
    case 'USER': return '普通学生';
    case 'CONSULTANT': return '心理咨询师';
    case 'ADMIN': return '系统管理员';
    default: return '未知';
  }
};

// 状态标签显示
const getStatusLabel = (status) => {
  switch (String(status).toUpperCase()) {
    case 'ACTIVE': return '活跃';
    case 'INACTIVE': return '不活跃';
    case 'PENDING': return '待审核';
    case 'BANNED': return '已封禁';
    default: return '未知';
  }
};


// ==================== 用户列表逻辑 (Tab 1) ====================

// 获取用户列表 (Requirement 1)
const getUserList = async () => {
  // 注意：userRole 现在是一个 computed ref，需要通过 .value 访问
  if (userRole.value !== 'ADMIN') {
    // 非管理员不执行数据加载
    return;
  }

  try {
    const res = await GetUsers(userForm);
    if (res && res.list) {
      userList.value = res.list.filter(user => user.role !== 'ADMIN'); // 需求1: 排除系统管理员
      total.value = res.pagination.total;
    } else {
      userList.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('获取用户列表失败', error);
    userList.value = [];
    total.value = 0;
    ElMessage.error('获取用户列表失败');
  }
};

// 分页变更
const handleCurrentChange = (page) => {
  userForm.page = page;
  getUserList();
};

// 封禁/启用学生用户 (Requirement 2)
const handleBlockStatus = (row) => {
  // 确保只有 USER 才能被封禁或启用
  if (row.role !== 'USER') {
    ElMessage.warning('只有普通学生用户才能被封禁或启用。');
    return;
  }

  // 1. 确定操作后的目标状态和行为标签。
  let newStatus;
  let actionLabel;
  let warningText = '';

  // 【核心修改】实现新逻辑：只有 BANNED 可以启用，其他状态执行封禁
  if (row.status === 'BANNED') {
      // 当前是 BANNED (已封禁) -> 目标是 ACTIVE (活跃/启用)
      newStatus = 'ACTIVE';
      actionLabel = '启用';
      warningText = ''; // 启用无需额外警告
  } else {
      // 当前是 ACTIVE 或 INACTIVE -> 目标是 BANNED (封禁)
      newStatus = 'BANNED';
      actionLabel = '封禁';
      warningText = '封禁后该用户将无法登录。';
  }

  ElMessageBox.confirm(
    `确定要${actionLabel}用户 [${row.realName || row.username}] 吗? ${warningText}`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      // 调用修改用户状态API
      await PutByUserIdStatus(row.id, { status: newStatus });
      ElMessage.success(`${actionLabel}成功！`);
      // 刷新列表
      getUserList();
    } catch (error) {
      console.error(`${actionLabel}用户失败:`, error);
      ElMessage.error(`${actionLabel}失败，请重试`);
    }
  }).catch(() => {}); // 用户取消操作
};

// 查看用户详情（包括咨询师信息）
const handleViewDetails = async (row) => {
  try {
    const res = await GetByUserId(row.id);

    // 【重要修改】判断逻辑，先尝试 res.data，如果不存在则使用 res 本身
    let userData = null;
    if (res && res.data) {
        // 假设返回结构是 { data: {...} }
        userData = res.data;
    } else if (res && typeof res === 'object' && !res.data) {
        // 假设返回结构直接是 {...} (用户对象)
        // 并且 res 不包含 code/message 这种统一接口字段 (可选)
        userData = res;
    }

    if (userData) {
        dialogForm.value = {
          ...userData, // 使用获取到的用户数据
          // 确保将关联的 consultant 对象 (如果存在) 映射到 dialogForm 的 consultantInfo 属性
          // 注意：如果后端返回的咨询师信息字段名是 consultant，这里不需要改
          consultantInfo: userData.role === 'CONSULTANT' ? userData.consultant : null,
          createdAt: userData.createdAt ? userData.createdAt.replace('T', ' ') : '-',
          lastLoginTime: userData.lastLoginTime ? userData.lastLoginTime.replace('T', ' ') : '-',
        };
        dialogVisible.value = true;
    } else {
        // API 成功响应，但数据为空或结构不对
        console.warn('获取用户详情成功，但响应数据为空或结构不正确:', res);
        ElMessage.error('获取详情失败：服务器返回空数据');
    }
  } catch (error) {
    // 网络或请求错误
    console.error('获取用户详情失败 (网络或请求错误):', error);
    ElMessage.error('获取详情失败：网络或服务器错误');
  }
};


// ==================== 咨询师审核逻辑 (Tab 2) ====================

// 1. 定义数据源 (注意：这里使用不带s的命名，与 template 保持一致)
const pendingConsultantList = ref([]);

// 2. 获取待审核咨询师列表 (API调用)
const getPendingConsultantList = async () => {
  // 如果不是管理员，不请求
  if (userRole.value !== 'ADMIN') return;

  try {
    // 调用 API
    const res = await GetPendingConsultants();

    // 【核心修复】
    // 你的 request 拦截器可能已经脱掉了外层壳，导致 res 直接就是数组。
    // 我们做一个兼容判断：如果 res 是数组，直接用；如果 res.data 是数组，用 res.data
    let rawList = [];
    if (Array.isArray(res)) {
        rawList = res;
    } else if (res && Array.isArray(res.data)) {
        rawList = res.data;
    }

    if (rawList.length > 0) {
      pendingConsultantList.value = rawList.map(item => ({
        ...item,
        // 如果后端返回包含了 user 对象，提取用户名，否则显示 N/A
        // 注意：你的API返回 user: null，所以这里会显示 N/A，这是正常的
        username: item.user ? item.user.username : 'N/A',
        // 格式化时间
        createdAtFormatted: item.createdAt ? item.createdAt.replace('T', ' ') : '-'
      }));
    } else {
      pendingConsultantList.value = [];
    }
  } catch (error) {
    console.error('获取待审核咨询师列表失败', error);
    pendingConsultantList.value = [];
    ElMessage.error('获取待审核咨询师列表失败');
  }
};

// 3. 触发审核/详情弹窗
const openReviewDialog = (item) => {
    currentReviewItem.value = item;
    // 初始化审核表单
    reviewForm.value = {
      action: 'APPROVE', // 默认通过
      reason: item.rejectedReason || '',
    };
    reviewDialogVisible.value = true;

    if (reviewFormRef.value) {
      reviewFormRef.value.clearValidate();
    }
};

// 4. 提交审核
const submitReview = async () => {
    if (!reviewFormRef.value) return;

    try {
        await reviewFormRef.value.validate();
        const consultantId = currentReviewItem.value.id;
        const submitData = {
            action: reviewForm.value.action,
            reason: reviewForm.value.reason,
        };

        await PutConsultantReview(consultantId, submitData);
        ElMessage.success(`操作成功`);

        // 刷新列表并关闭弹窗
        getPendingConsultantList();
        reviewDialogVisible.value = false;

        // 可选：刷新一下全部用户列表，因为状态变了
        if (activeTab.value === 'users') getUserList();
    } catch (error) {
        if (error !== false) {
            console.error('提交审核失败:', error);
            ElMessage.error('提交审核失败，请重试');
        }
    }
};

// 监听 Tab 切换，加载对应数据
watch(activeTab, (newTab) => {
  if (newTab === 'users') {
    getUserList();
  } else if (newTab === 'consultant-pending') {
    getPendingConsultantList();
  }
}, { immediate: true });

</script>


<style scoped>
/* ==================== 权限不足警告样式 (新增或修正) ==================== */
.permission-alert {
  background-color: #fff1f0;
  border: 1px solid #ff4d4f;
  color: #cf1322;
  padding: 30px;
  margin-top: 20px;
  border-radius: 8px;
  text-align: center;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.permission-alert i {
  margin-right: 10px;
}

/* ==================== 通用样式 ==================== */
.user-management-page {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.user-tabs {
    margin-top: 20px;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

/* 角色标签 */
.role-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  width: 80px; /* 根据最长标签（如“心理咨询师”）来设置合适的宽度 */
  text-align: center;
}

.role-user {
  background-color: #1890ff;
}

.role-consultant {
  background-color: #52c41a;
}

.role-admin {
    background-color: #f5222d;
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  width: 60px; /* 根据“已封禁”或“待审核”来设置合适的宽度 */
  text-align: center;
}

.status-active {
  background-color: #52c41a;
}

.status-banned {
  background-color: #f5222d; /* 需求2: 封禁状态颜色 */
}

.status-pending {
  background-color: #faad14;
}
.status-inactive { /* 【补充点 2】新增 INACTIVE 样式 */
  background-color: #909399; /* 不活跃/待定：灰色 */
}
/* 表格操作按钮 */
.action-btn {
  padding: 8px 12px;
  margin-right: 5px;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.view-btn {
  color: #1890ff;
  background: #e6f7ff;
  border-color: transparent;
}

.view-btn:hover {
  background: #bfe6ff;
}

.toggle-status-btn {
  color: white;
  border: none;
}

.status-block {
  background-color: #ff4d4f;
}

/* 封禁按钮 */
.status-block:hover {
  background-color: #cf1322;
}

.status-unblock {
  background-color: #52c41a;
}

/* 启用按钮 */
.status-unblock:hover {
  background-color: #389e0d;
}

/* 分页区域 */
.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding-top: 15px;
}
/* ==================== 咨询师申请表单样式 (新增) ==================== */
.consultant-apply-container {
    max-width: 800px;
    margin: 30px auto;
    padding: 30px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.form-title {
    font-size: 22px;
    color: #303133;
    border-bottom: 2px solid #409eff;
    padding-bottom: 10px;
    margin-bottom: 10px;
}

.form-subtitle {
    color: #909399;
    font-size: 14px;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #ebeef5;
}

.consultant-form .el-input-number {
    width: 120px;
}
.approved-tip {
  background-color: #f0f9eb; /* 浅绿色背景 */
  color: #67c23a;           /* 深绿色文字 */
  border: 1px solid #c2e7b0; /* 绿色边框 */
  padding: 15px 20px;
  margin-bottom: 25px;
  border-radius: 4px;
}

.approved-tip h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: bold;
}

.approved-tip p {
  margin: 0;
  font-size: 14px;
  color: #5e6d82;
}
</style>
