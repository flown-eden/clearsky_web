<template>
  <div class="resource-page">
    <h2 class="page-title">心理资源管理中心</h2>

    <template v-if="userRole === 'ADMIN'">
      <div class="stats-cards">
        <div class="stat-card total-resources">
          <div class="card-body">
            <h4 class="card-label">总资源量</h4>
            <p class="card-value">{{ stats.total || 0 }} <span class="unit">份</span></p>
          </div>
          <i class="icon-placeholder total-icon"></i>
        </div>

        <div class="stat-card article-count">
          <div class="card-body">
            <h4 class="card-label">文章资源</h4>
            <p class="card-value">{{ stats.article || 0 }} <span class="unit">篇</span></p>
          </div>
          <i class="icon-placeholder article-icon"></i>
        </div>

        <div class="stat-card video-count">
          <div class="card-body">
            <h4 class="card-label">视频资源</h4>
            <p class="card-value">{{ stats.video || 0 }} <span class="unit">部</span></p>
          </div>
          <i class="icon-placeholder video-icon"></i>
        </div>

        <div class="stat-card music-count">
          <div class="card-body">
            <h4 class="card-label">音乐资源</h4>
            <p class="card-value">{{ stats.music || 0 }} <span class="unit">首</span></p>
          </div>
          <i class="icon-placeholder music-icon"></i>
        </div>
      </div>

      <div class="resource-table-section">
        <div class="tabs-header">
          <div v-for="type in resourceTypes" :key="type.value"
            :class="['tab-item', { active: currentType === type.value }]" @click="changeResourceType(type.value)">
            {{ type.label }}
          </div>
        </div>

        <div class="toolbar-wrapper">
          <div class="filter-controls">
            <select v-model="resourcesForm.categoryId" class="filter-select category-filter">
              <option value="">{{ currentTypeLabel }}分类 (全部)</option>
              <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <input type="text" v-model="resourcesForm.keyword" :placeholder="'搜索' + currentTypeLabel + '名称...'"
              class="search-input" />
            <button class="search-btn" @click="fetchResources">查询</button>
          </div>

          <div class="action-buttons">
            <button class="action-btn-secondary" @click="handleCategoryManage">
              管理分类
            </button>
            <button class="action-btn-primary" @click="handleUploadResource">
              上传/新增 {{ currentTypeLabel }}
            </button>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称 / 标题</th>
              <th>分类</th>
              <th>类型</th>
              <th>时长/字数</th>
              <th>上传时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in resourcesList" :key="index">
              <td>{{ item.id }}</td>
              <td>{{ item.title }}</td>
              <td>{{ item.categoryName || '-' }}</td>
              <td>
                <span class="type-tag type-article" v-if="item.resourceType === 'ARTICLE'">文章</span>
                 <span class="type-tag type-video" v-else-if="item.resourceType === 'VIDEO'">视频</span>
                 <span class="type-tag type-music" v-else-if="item.resourceType === 'MUSIC'">音乐</span>
                 <span v-else>{{ item.resourceType }}</span>
              </td>
              <td>{{ item.duration || '-' }}</td>
              <td>{{ item.createdAt ? item.createdAt.replace("T", " ") : '-' }}</td>
              <td>
                <button class="action-btn edit-btn" @click="handleEdit(item.id)">
                  编辑
                </button>
                <button class="action-btn delete-btn" @click="handleDelete(item.id)">
                  删除
                </button>
              </td>
            </tr>
            <tr v-if="resourcesList.length === 0">
               <td colspan="7" style="text-align: center; padding: 20px; color: #999;">暂无数据</td>
             </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button :disabled="resourcesForm.page === 1" @click="reduce">
            &lt;
          </button>
          <span class="page-info">第 {{ resourcesForm.page }} 页 / 共 {{ totalPages }} 页</span>
          <button @click="add" :disabled="resourcesForm.page >= totalPages">
            &gt;
          </button>
        </div>
      </div>
    </template>

    <div v-else class="permission-alert">
      <div class="alert-icon">❌</div>
      <div class="alert-content">
        <h3>权限不足</h3>
        <p>您当前的账户角色（{{ displayRole }}）无权访问心理资源管理中心。</p>
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogVisible" :title="title" width="500">
    <el-form :model="form" label-width="auto" style="max-width: 600px">
      <el-form-item label="资源标题">
        <el-input v-model="form.title" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.categoryId" placeholder="请选择分类">
          <el-option v-for="i in filteredCategories" :key="i.id" :label="i.name" :value="i.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="字数/时长">
        <el-input v-model="form.duration" />
      </el-form-item>
      <el-form-item label="作者">
        <el-input v-model="form.author" />
      </el-form-item>
      <el-form-item label="上传时间" v-if="form.id">
        <el-input v-model="form.createdAt" disabled />
      </el-form-item>
      <el-form-item label="资源描述">
        <el-input v-model="form.description" />
      </el-form-item>
      <el-form-item label="内容" v-if="form.resourceType == 'ARTICLE'">
        <el-input v-model="form.content" type="textarea" />
      </el-form-item>
      <el-form-item label="视频链接" v-if="form.resourceType == 'VIDEO'">
        <el-input v-model="form.fileUrl" />
      </el-form-item>
      <el-form-item label="音乐链接" v-if="form.resourceType == 'MUSIC'">
        <el-input v-model="form.fileUrl" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit"> 确定 </el-button>
      </div>
    </template>
  </el-dialog>
  <ResourceCategory ref="ResourceCategoryRef"></ResourceCategory>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import {
  GetResources,
  DeleteById,
  GetResourcesId,
  PostAddResources,
  PutResourcesId,
  GetResourceCategories
} from "@/api/resources.js";
import { ElMessage } from "element-plus";
import ResourceCategory from "@/components/CategoryComponents/ResourceCategory.vue";

const ResourceCategoryRef = ref(null);
const currentType = ref("ARTICLE"); // 默认显示文章
const filterCategory = ref("");
const searchKeyword = ref("");
const userRole = ref(null);
const resourcesList = ref([]);
const totalPages = ref(1); // 总页数
const title = ref();
const dialogVisible = ref(false);

// 统计数据
const stats = ref({
  total: 0,
  article: 0,
  video: 0,
  music: 0
});

const resourcesForm = ref({
  page: 1,
  size: 10,
  type: "ARTICLE", // 初始化默认类型
  categoryId: "",
  keyword: "",
});

const form = ref({
  title: "",
  description: "",
  categoryName: "",
  resourceType: "",
  content: "",
  fileUrl: "",
  coverImage: "",
  duration: "",
  author: "",
  status: "",
  createdAt: "",
});

const resourceTypes = [
  { label: "文章", value: "ARTICLE" },
  { label: "视频", value: "VIDEO" },
  { label: "音乐", value: "MUSIC" },
];

const categoriesList = ref([]);

// 获取分类
const loadCategoryData = async () => {
  await GetResourceCategories().then((res) => {
    // 适配可能的返回值结构
    categoriesList.value = Array.isArray(res) ? res : (res.data || []);
  });
};

// 获取资源列表 [核心修改]
const getResourcesList = async () => {
  try {
    const res = await GetResources(resourcesForm.value);
    console.log("资源列表API返回 (解包后):", res);

    // **核心修改：适配 res.list 和 res.pagination 结构**
    if (res && res.list && res.pagination) {
      resourcesList.value = res.list; // 使用 list 字段作为列表数据
      totalPages.value = res.pagination.pages || 1; // 使用 pagination.pages 字段作为总页数
    } else {
        // 兼容之前假设的 { records, pages } 结构，以防其他接口返回方式不同
        resourcesList.value = res.records || [];
        totalPages.value = res.pages || 1;
    }
  } catch (error) {
    console.error("获取资源列表失败", error);
    resourcesList.value = [];
    totalPages.value = 1;
  }
};

// 获取统计数据（动态填充顶部卡片）
const fetchStats = async () => {
  // 由于没有直接的 Dashboard 统计接口细分到资源类型，
  // 这里并发请求三次资源列表接口（size=1）来获取各类型的 total
  try {
    const [articleRes, videoRes, musicRes] = await Promise.all([
      GetResources({ page: 1, size: 1, type: 'ARTICLE' }),
      GetResources({ page: 1, size: 1, type: 'VIDEO' }),
      GetResources({ page: 1, size: 1, type: 'MUSIC' })
    ]);

    const getCount = (res) => {
      // **核心修改：从 res.pagination.total 获取总数**
      return (res && res.pagination) ? (res.pagination.total || 0) : 0;
    };

    const aCount = getCount(articleRes);
    const vCount = getCount(videoRes);
    const mCount = getCount(musicRes);

    stats.value = {
      article: aCount,
      video: vCount,
      music: mCount,
      total: aCount + vCount + mCount
    };
  } catch (e) {
    console.error("获取统计数据失败", e);
  }
};

onMounted(() => {
  // 权限获取逻辑
  const storedUserInfo = localStorage.getItem("user");
  if (storedUserInfo) {
    try {
      const userInfo = JSON.parse(storedUserInfo);
      userRole.value = userInfo.role ? userInfo.role.toUpperCase() : "ADMIN";
    } catch (e) {
      userRole.value = "ADMIN";
    }
  } else {
    userRole.value = "ADMIN";
  }

  // 初始化加载
  loadCategoryData();
  getResourcesList();
  fetchStats(); // 加载统计
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

const currentTypeLabel = computed(() => {
  const type = resourceTypes.find((t) => t.value === currentType.value);
  return type ? type.label : "资源";
});

const filteredCategories = computed(() => {
  if(!categoriesList.value) return [];
  // 假设分类也有 type 字段，如果没有则显示所有
  return categoriesList.value.filter((cat) => !cat.type || cat.type === currentType.value);
});

// --- 方法 ---
const changeResourceType = (type) => {
  currentType.value = type;
  resourcesForm.value.type = type;
  resourcesForm.value.page = 1; // 切换类型重置为第一页
  resourcesForm.value.categoryId = "";
  resourcesForm.value.keyword = "";

  getResourcesList();
};

const fetchResources = () => {
  resourcesForm.value.page = 1;
  getResourcesList();
};

const handleUploadResource = () => {
  dialogVisible.value = true;
  form.value = {
    title: "",
    description: "",
    categoryId: "", // 修正字段名
    resourceType: currentType.value,
    content: "",
    fileUrl: "",
    duration: "",
    author: "",
  };
  title.value = "新增" + currentTypeLabel.value;
};

const handleEdit = async (id) => {
  try {
    const res = await GetResourcesId(id);
    const data = res.data || res;
    form.value = { ...data };
    dialogVisible.value = true;
    title.value = "编辑" + currentTypeLabel.value;
  } catch (e) {
    ElMessage.error("获取详情失败");
  }
};

const handleDelete = async (id) => {
  if (confirm(`确定删除该资源吗？`)) {
    await DeleteById(id).then(() => {
      ElMessage.success("删除成功");
      getResourcesList();
      fetchStats(); // 删除后刷新统计
    });
  }
};

const handleCategoryManage = () => {
  ResourceCategoryRef.value.open();
};

// 分页
const reduce = () => {
  if (resourcesForm.value.page > 1) {
    resourcesForm.value.page--;
    getResourcesList();
  }
};
const add = () => {
  if (resourcesForm.value.page < totalPages.value) {
    resourcesForm.value.page++;
    getResourcesList();
  }
};

const onSubmit = async () => {
  if (form.value.id) {
    await PutResourcesId(form.value.id, form.value);
    ElMessage.success("编辑成功");
  } else {
    await PostAddResources(form.value);
    ElMessage.success("添加成功");
  }
  dialogVisible.value = false;
  getResourcesList();
  fetchStats(); // 提交后刷新统计
};
</script>

<style scoped>
/* ************************************************* */
/* *************** 心理资源管理页面样式 ****************** */
/* ************************************************* */

.resource-page {
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

/* --- 统计卡片布局 (沿用美化风格) --- */
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
.total-resources {
  border-color: #3b5998;
}

.total-resources .card-value {
  color: #3b5998;
}

.total-icon {
  background-color: #3b5998;
}

.article-count {
  border-color: #1890ff;
}

.article-count .card-value {
  color: #1890ff;
}

.article-icon {
  background-color: #1890ff;
}

.video-count {
  border-color: #faad14;
}

.video-count .card-value {
  color: #faad14;
}

.video-icon {
  background-color: #faad14;
}

.music-count {
  border-color: #f5222d;
}

.music-count .card-value {
  color: #f5222d;
}

.music-icon {
  background-color: #f5222d;
}

/* --- 资源列表区域 --- */
.resource-table-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

/* 标签页样式 */
.tabs-header {
  display: flex;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 20px;
}

.tab-item {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  font-weight: 500;
  color: #595959;
  border-bottom: 3px solid transparent;
  margin-right: 15px;
  transition: all 0.3s;
}

.tab-item:hover {
  color: #3b5998;
}

.tab-item.active {
  color: #3b5998;
  border-bottom: 3px solid #3b5998;
  font-weight: 600;
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
.action-btn-primary,
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

.action-btn-primary {
  background-color: #13c2c2;
}

/* 上传/新增资源 */
.action-btn-secondary {
  background-color: #8c9fae;
}

/* 管理分类 */

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
}

.data-table tr {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

/* 类型标签 */
.type-tag {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
  color: white;
}

.type-article {
  background-color: #1890ff;
}

.type-video {
  background-color: #faad14;
}

.type-music {
  background-color: #f5222d;
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

.edit-btn {
  color: #1890ff;
  background: #e6f7ff;
}

.delete-btn {
  color: white;
  background-color: #ff4d4f;
  border-color: #ff4d4f;
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

/* 分页区域 */
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
