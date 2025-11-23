<template>
  <div class="community-page">
    <h2 class="page-title">社区博文管理中心</h2>

    <template v-if="userRole === 'ADMIN'">
      <div class="stats-cards">
        <div class="stat-card total-posts">
          <div class="card-body">
            <h4 class="card-label">总博文数</h4>
            <p class="card-value">{{ totalPosts }} <span class="unit">篇</span></p>
          </div>
          <i class="icon-placeholder total-icon"></i>
        </div>

        <div class="stat-card pending-posts">
          <div class="card-body">
            <h4 class="card-label">待审核博文</h4>
            <p class="card-value">{{ statisticsList.PENDING || 0 }} <span class="unit">篇</span></p>
          </div>
          <i class="icon-placeholder pending-icon"></i>
        </div>

        <div class="stat-card approved-posts">
          <div class="card-body">
            <h4 class="card-label">已通过博文</h4>
            <p class="card-value">{{ statisticsList.APPROVED || 0 }} <span class="unit">篇</span></p>
          </div>
          <i class="icon-placeholder approved-icon"></i>
        </div>

        <div class="stat-card rejected-posts">
          <div class="card-body">
            <h4 class="card-label">已拒绝博文</h4>
            <p class="card-value">{{ statisticsList.REJECTED || 0 }} <span class="unit">篇</span></p>
          </div>
          <i class="icon-placeholder rejected-icon"></i>
        </div>
      </div>

      <div class="post-table-section">
        <div class="toolbar-wrapper">
          <div class="filter-controls">
            <select v-model="communityForm.status" class="filter-select status-filter">
              <option value="">所有状态</option>
              <option value="PENDING">待审核</option>
              <option value="APPROVED">已通过</option>
            </select>
            <input type="text" v-model="communityForm.keyword" placeholder="搜索标题、作者..." class="search-input" />
            <button class="search-btn" @click="fetchPosts">查询</button>
          </div>

          </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>作者</th>
              <th>状态</th>
              <th>发布时间</th>
              <th>浏览/评论</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in communityList" :key="index">
              <td>{{ item.id }}</td>
              <td>{{ item.title }}</td>
              <td>{{ item.authorName }}</td>
              <td>
                <span :class="['status-tag', 'status-' + (item.status ? item.status.toLowerCase() : 'unknown')]">
                    {{ getStatusLabel(item.status) }}
                </span>
              </td>
              <td>{{ item.createdAt ? item.createdAt.replace('T', ' ') : '-' }}</td>
              <td>{{ item.viewCount || 0 }}/ {{ item.commentCount || 0 }}</td>
              <td>
                <button class="action-btn view-btn" @click="handleViewDetails(item)">
                  详情
                </button>
                
                <template v-if="item.status === 'PENDING'">
                  <button class="action-btn approve-btn" @click="handleReview(item.id, 'APPROVED')">通过</button>
                  <button class="action-btn reject-btn" @click="handleReview(item.id, 'REJECTED')">拒绝</button>
                </template>
                
                <template v-else-if="item.status === 'APPROVED'">
                  <button class="action-btn reject-btn" @click="handleReview(item.id, 'REJECTED')">撤下</button>
                </template>
                <button class="action-btn delete-btn" @click="handleDelete(item.id)">
                  删除
                </button>
              </td>
            </tr>
            <tr v-if="communityList.length === 0">
               <td colspan="7" style="text-align: center; padding: 20px; color: #999;">暂无数据</td>
             </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button :disabled="communityForm.page <= 1 || totalPages <= 1" @click="reduce">
            &lt;
          </button>
          <span class="page-info">第 {{ communityForm.page }} 页 / 共 {{ totalPages }} 页</span>
          <button :disabled="communityForm.page >= totalPages || totalPages <= 1" @click="add">
            &gt;
          </button>
        </div>
      </div>
    </template>

    <div v-else class="permission-alert">
      <div class="alert-icon">❌</div>
      <div class="alert-content">
        <h3>权限不足</h3>
        <p>您当前的账户角色（{{ displayRole }}）无权访问社区博文管理中心。</p>
      </div>
    </div>
  </div>
  
  <el-dialog v-model="dialogVisible" :title="title" width="500" :before-close="handleClose">
    <el-form :model="dialogForm" label-width="auto" style="max-width: 600px" :disabled="true">
      <el-form-item label="文章标题">
        <el-input v-model="dialogForm.title" />
      </el-form-item>
      <el-form-item label="文章内容">
        <el-input v-model="dialogForm.content" type="textarea" :rows="4" />
      </el-form-item>
      <el-form-item label="作者">
        <el-input v-model="dialogForm.authorName" />
      </el-form-item>
      <el-form-item label="浏览量">
        <el-input v-model="dialogForm.viewCount" />
      </el-form-item>
      <el-form-item label="获赞数">
        <el-input v-model="dialogForm.likeCount" />
      </el-form-item>
      <el-form-item label="评论数">
        <el-input v-model="dialogForm.commentCount" />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-input v-model="dialogForm.createdAt" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import {
  GetCommunity,
  PutCommunityById,
  DeleteById,
  GetPostsInfo,
  GetStatistics,
  GetAdminPendingPosts
} from "@/api/community.js";
import { ElMessage } from "element-plus";

const userRole = ref(null);
const communityList = ref([]);
const dialogVisible = ref(false);
const title = ref();
const totalPages = ref(1); 
const communityForm = ref({
  page: 1,
  size: 10,
  keyword: "",
  status: "",
});
const dialogForm = ref({
  title: '',
  content: '', 
  likeCount: '',
  commentCount: '',
  authorName: '',
  createdAt: '',
  viewCount: '',
});

// 统计数据
const statisticsList = ref({
  PENDING: 0,
  APPROVED: 0,
  REJECTED: 0,
});

// 计算总博文数 (用于顶部卡片)
const totalPosts = computed(() => {
  const stats = statisticsList.value;
  return (stats.PENDING || 0) + (stats.APPROVED || 0) + (stats.REJECTED || 0);
});

// 根据状态码返回中文标签
const getStatusLabel = (status) => {
  // 添加空值检查
  if (!status) return '未知状态'; 
    
  // 关键修改：统一将传入的状态转换为大写进行匹配
  const upperStatus = status.toUpperCase(); 

  switch (upperStatus) {
    case 'PENDING':
      return '待审核';
    case 'APPROVED':
      return '已通过';
    case 'REJECTED':
      return '已拒绝'; 
    default:
      // 如果仍返回空，说明状态值完全不在预期内
      return '未知';
  }
};

// 获取博文列表 [GetCommunity / GetAdminPendingPosts]
const getCommunityList = async () => {
  try {
    let listRecords = []; // 存储最终列表
    let resGeneral;
    let pagination = {};

    // 1. 处理 '待审核' (PENDING) 状态
    if (communityForm.value.status === 'PENDING') {
      const resPending = await GetAdminPendingPosts();
      console.log("待审核博文API返回 (Admin):", resPending);
      
      listRecords = Array.isArray(resPending) ? resPending : resPending.data || [];
      
      communityList.value = listRecords;
      totalPages.value = 1; // 强制设为1，禁用分页
      communityForm.value.page = 1; 
      return; // PENDING 状态处理完毕后直接返回
    }

    // 2. 处理 '所有状态' ("")、'已通过' (APPROVED)、'已拒绝' (REJECTED)
    // 调用通用分页接口
    resGeneral = await GetCommunity(communityForm.value);
    console.log("博文列表API返回 (通用):", resGeneral);

    listRecords = resGeneral.list || [];
    pagination = resGeneral.pagination || {};
    listRecords.forEach(item => {
        if (item && !item.status) {
            item.status = 'APPROVED';
        }
    });
    // 3. 如果是 '所有状态' (""), 额外获取 PENDING 列表并合并
    if (communityForm.value.status === "") {
      const resPending = await GetAdminPendingPosts();
      console.log("额外获取待审核博文 (Admin):", resPending);
      
      const pendingRecords = Array.isArray(resPending) ? resPending : resPending.data || [];
      
      // 合并列表：将待审核 (非分页) 放在最前面，然后接通用列表 (分页结果)
      listRecords = [...pendingRecords, ...listRecords];
      
      // 注意：分页信息仍然以通用接口 ( APPROVED/REJECTED ) 为准，因为 PENDING 是非分页的。
    }
    
    // 更新列表数据和分页
    communityList.value = listRecords;
    totalPages.value = pagination.pages || 1;
    
  } catch (error) {
    console.error("获取博文列表失败", error);
    communityList.value = [];
    totalPages.value = 1;
  }
};

// 获取统计数据 [GetStatistics]
const getStatistics = async () => {
  try {
    const res = await GetStatistics();
    console.log("统计数据API返回:", res);
    // 假设 API 返回一个对象，key 为状态名
    if (res) {
      statisticsList.value = {
        PENDING: res.PENDING || 0,
        APPROVED: res.APPROVED || 0,
        REJECTED: res.REJECTED || 0,
      };
    }
  } catch (e) {
    console.error("获取统计数据失败", e);
  }
};

// 页面加载时执行
onMounted(() => {
  // 权限获取逻辑（保持一致）
  const storedUserInfo = localStorage.getItem("user");
  if (storedUserInfo) {
    try {
      const userInfo = JSON.parse(storedUserInfo);
      userRole.value = userInfo.role ? userInfo.role.toUpperCase() : "ADMIN";
    } catch (e) {
      console.log(e);
      userRole.value = "ADMIN";
    }
  } else {
    userRole.value = "ADMIN";
  }

  // 只有 ADMIN 才有必要加载数据和统计
  if (userRole.value === 'ADMIN') {
    getCommunityList();
    getStatistics();
  }
});

const displayRole = computed(() => {
  switch (userRole.value) {
    case "USER":
      return "学生用户";
    case "CONSULTANT":
      return "心理咨询师";
    case "ADMIN":
      return "系统管理员";
    default:
      return "未登录/未知用户";
  }
});

// --- 方法 ---

// 查询/筛选
const fetchPosts = () => {
  communityForm.value.page = 1;
  getCommunityList();
};

// 查看详情
const handleViewDetails = async (item) => {
  title.value = "博文详情";
  let detailData = { ...item }; // 默认使用列表数据

  const status = item.status ? item.status.toUpperCase() : null;

  // 仅对 '已通过' (APPROVED) 状态的博文调用详情 API
  // 因为列表页的 APPROVED 博文数据是不完整的
  if (status === 'APPROVED') {
    try {
      const res = await GetPostsInfo(item.id);
      
      // 假设 GetPostsInfo 成功返回的数据在 res.data 中
      if (res && res.data) {
        detailData = res.data;
      } else {
        // 如果API返回结构异常，至少保留原始列表数据
        ElMessage.warning('未能获取完整博文详情，显示列表页部分信息。');
      }

    } catch (error) {
      console.error("查询博文详情失败", item.id, error);
      ElMessage.error('获取博文详情失败，请检查网络或后端服务');
      return; // 详情获取失败，终止弹窗
    }
  } 
  
  // 对于 PENDING 状态的博文，假设 listRecords 中已包含 content 字段，直接使用 item 即可。

  // 填充对话框表单
  dialogForm.value = {
    id: detailData.id,
    title: detailData.title,
    content: detailData.content, // 现在这个字段对于 APPROVED 帖子将是完整的
    authorName: detailData.authorName,
    viewCount: detailData.viewCount,
    likeCount: detailData.likeCount,
    commentCount: detailData.commentCount,
    createdAt: detailData.createdAt ? detailData.createdAt.replace('T', ' ') : '-',
    // ... 如果 dialogForm 还有其他字段，请确保它们也被赋值 ...
  };
  
  // 显示弹窗
  dialogVisible.value = true;
};

// 审核或变更博文状态 [PutCommunityById]
const handleReview = async (id, newStatus) => {
  if (userRole.value !== "ADMIN") {
    alert("权限不足！只有系统管理员可以审核博文。");
    return;
  }
  
  const actionLabel = getStatusLabel(newStatus);
  if (confirm(`ADMIN 确定将博文 ID: ${id} 状态变更为【${actionLabel}】吗？`)) {
    try {
      // API要求 PUT /admin/community/posts/${id}/status，body 传递新状态
      await PutCommunityById(id, { status: newStatus });
      ElMessage.success(`状态变更成功：${actionLabel}`);
      // 刷新列表和统计数据
      getCommunityList();
      getStatistics();
    } catch (e) {
      ElMessage.error(`状态变更失败，请检查 API 或权限。`);
    }
  }
};

// 删除博文 [DeleteById]
const handleDelete = async (id) => {
  if (userRole.value !== "ADMIN") {
    alert("权限不足！只有系统管理员可以删除博文。");
    return;
  }
  if (confirm(`ADMIN 确定永久删除博文 ID: ${id} 吗？`)) {
    try {
      await DeleteById(id);
      ElMessage.success("删除成功");
      // 刷新列表和统计数据
      getCommunityList();
      getStatistics();
    } catch (e) {
      ElMessage.error("删除失败，请检查 API 或权限。");
    }
  }
};

// 详情弹窗关闭方法 (修复 Vue warn)
const handleClose = (done) => {
  dialogVisible.value = false;
  if (typeof done === 'function') {
    done();
  }
};

// 分页
const reduce = () => {
  if (communityForm.value.page > 1) {
    communityForm.value.page--;
    getCommunityList();
  }
};
const add = () => {
  if (communityForm.value.page < totalPages.value) {
    communityForm.value.page++;
    getCommunityList();
  }
};
</script>

<style scoped>
/* ************************************************* */
/* *************** 社区管理页面样式 (保持不变) ****************** */
/* ************************************************* */

.community-page {
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

/* --- 统计卡片布局 --- */
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
.total-posts {
  border-color: #3b5998;
}

.total-posts .card-value {
  color: #3b5998;
}

.total-icon {
  background-color: #3b5998;
}

.pending-posts {
  border-color: #faad14;
}

.pending-posts .card-value {
  color: #faad14;
}

.pending-icon {
  background-color: #faad14;
}

.approved-posts {
  border-color: #52c41a;
}

.approved-posts .card-value {
  color: #52c41a;
}

.approved-icon {
  background-color: #52c41a;
}

.rejected-posts {
  border-color: #f5222d;
}

.rejected-posts .card-value {
  color: #f5222d;
}

.rejected-icon {
  background-color: #f5222d;
}

/* --- 表格区域 --- */
.post-table-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

/* 工具栏 */
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.filter-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.filter-select,
.search-input {
  padding: 10px 15px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  height: 40px;
}

.search-input {
  width: 220px;
}

/* 按钮样式 */
.search-btn,
.action-btn-secondary {
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  height: 40px;
}

.search-btn {
  background-color: #3b5998;
}

.search-btn:hover {
  background-color: #4c69b0;
}

.action-btn-secondary {
  background-color: #8c9fae;
}

.action-btn-secondary:hover {
  background-color: #7a8c9e;
}

/* 表格样式 */
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
  position: sticky;
  top: 0;
  border-bottom: none;
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

.status-approved {
  background-color: #52c41a;
}


/* 操作按钮 */
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
}

.view-btn:hover {
  background: #bfe6ff;
}

.approve-btn {
  color: white;
  background-color: #52c41a;
  border-color: #52c41a;
}

.approve-btn:hover {
  background-color: #389e0d;
}

.reject-btn {
  color: white;
  background-color: #faad14;
  border-color: #faad14;
}

.reject-btn:hover {
  background-color: #d49200;
}

.delete-btn {
  color: white;
  background-color: #f5222d;
  border-color: #f5222d;
}

.delete-btn:hover {
  background-color: #cf1322;
}

/* --- 权限不足警告样式 --- */
.permission-alert {
  background-color: #fff1f0;
  border: 1px solid #ff4d4f;
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

/* 分页区域 (保持一致) */
.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding-top: 15px;
}

.pagination button {
  padding: 8px 15px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.page-info {
  font-size: 14px;
  color: #595959;
}
</style>