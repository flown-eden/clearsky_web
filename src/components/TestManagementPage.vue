<template>
  <div class="test-management-page">
    <h2 class="page-title">心理测评管理中心</h2>

    <template v-if="userRole === 'ADMIN' || userRole === 'CONSULTANT'">
      <div v-if="userRole === 'CONSULTANT'" class="permission-hint">
        💡 您是心理咨询师，仅允许新增测评和查看结果，无法修改或删除现有测评。
      </div>
      <div class="test-table-section">
        <div class="toolbar-wrapper">
          <div class="filter-controls">
            <select v-model="testsForm.categoryId" class="filter-select category-filter">
              <option value="">所有分类</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <select v-model="testsForm.status" class="filter-select status-filter">
              <option value="">所有状态</option>
              <option value="PUBLISHED">已发布</option>
              <option value="DRAFT">草稿</option>
              <option value="PENDING">待审核</option>
            </select>
            <input
              type="text"
              v-model="testsForm.keyword"
              placeholder="搜索测评名称..."
              class="search-input"
            />
            <button class="search-btn" @click="fetchTests">查询</button>
          </div>

          <div class="action-buttons">
            <button
              v-if="userRole === 'ADMIN'"
              class="action-btn-secondary"
              @click="handleCategoryManage"
            >
              管理分类
            </button>

            <button class="action-btn-primary" @click="handleAddTest">新增测评</button>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>测评名称</th>
              <th>分类</th>
              <!-- <th>状态</th> -->
              <th>题目数</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in testsList" :key="index">
              <td>{{ item.id }}</td>
              <td>{{ item.title }}</td>
              <td>{{ item.categoryName }}</td>
              <!-- 因为后端没有返回状态值 -->
              <!-- <td><span class="status-tag status-published">已发布</span></td> -->
              <td>{{ item.questionCount }}</td>
              <td>{{ item.createdAt }}</td>
              <td>
                <button
                  v-if="userRole === 'ADMIN'"
                  class="action-btn edit-btn"
                  @click="handleEdit(item.id)"
                >
                  编辑
                </button>
                <button class="action-btn result-btn" @click="openResultsModal(item.id)">
                  结果
                </button>
                <button
                  v-if="userRole === 'ADMIN'"
                  class="action-btn delete-btn"
                  @click="handleDelete(item.id)"
                >
                  删除
                </button>
              </td>
            </tr>
            <!-- <tr>
              <td>2002</td>
              <td>抑郁自评量表 (SDS)</td>
              <td>情绪测评</td>
              <td><span class="status-tag status-draft">草稿</span></td>
              <td>20</td>
              <td>2024-05-15</td>
              <td>
                <button v-if="userRole === 'ADMIN'" class="action-btn edit-btn" @click="handleEdit(2002)">编辑</button>
                <button class="action-btn result-btn" @click="openResultsModal(2002)">结果</button>
                <button v-if="userRole === 'ADMIN'" class="action-btn publish-btn"
                  @click="handlePublish(2002)">发布</button>
              </td>
            </tr> -->
            <!-- <tr v-if="userRole === 'CONSULTANT'">
              <td>2003</td>
              <td>个人创伤恢复量表</td>
              <td>心理治疗</td>
              <td><span class="status-tag status-draft">草稿</span></td>
              <td>45</td>
              <td>2024-11-01</td>
              <td>
                <button class="action-btn result-btn" @click="openResultsModal(2003)">
                  结果
                </button>
                <span style="font-size: 12px; color: #ff4d4f">(权限不足)</span>
              </td>
            </tr> -->
          </tbody>
        </table>

        <div class="pagination">...</div>
      </div>
    </template>

    <div v-else class="permission-alert">
      <div class="alert-icon">❌</div>
      <div class="alert-content">
        <h3>权限不足</h3>
        <p>您当前的账户角色（{{ displayRole }}）无权访问测评管理中心。</p>
      </div>
    </div>

    <div v-if="showResultsModal" class="modal-overlay">
      <div class="results-modal">
        <h3>测评 ID: {{ selectedTestId }} - 结果查询</h3>
        <div class="modal-body">
          <input
            type="text"
            v-model="resultSearchUsername"
            placeholder="请输入学生用户名 (学号) 搜索历史结果"
            class="search-input-modal"
          />
          <button class="search-btn-modal" @click="handleViewResults">搜索结果</button>

          <div v-if="searchedResults.length" class="result-list">
            <h4>搜索结果 ({{ searchedResults.length }} 条)</h4>
            <ul>
              <li v-for="res in searchedResults" :key="res.id">
                {{ res.username }} ({{ res.score }}分) - {{ res.date }}
                <button class="action-btn view-btn" @click="handleResultDetail(res.id)">
                  查看详情
                </button>
              </li>
            </ul>
          </div>
          <div v-else-if="resultSearchAttempted" class="no-result">
            未找到 {{ resultSearchUsername }} 的测评结果。
          </div>
        </div>
        <button class="close-btn" @click="closeResultsModal">关闭</button>
      </div>
    </div>
  </div>

  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="900"
    :before-close="handleClose"
    class="test-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="dialog-content">
      <el-form
        :model="dialogForm"
        label-width="120px"
        class="test-form"
        :rules="formRules"
        ref="formRef"
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-document"></i>
            基本信息
          </div>
          <div class="section-content">
            <el-form-item label="测评标题" prop="title">
              <el-input
                v-model="dialogForm.title"
                placeholder="请输入测评标题"
                clearable
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="测评描述" prop="description">
              <el-input
                v-model="dialogForm.description"
                type="textarea"
                placeholder="请输入测评描述"
                :rows="3"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="分类名称" prop="categoryId">
              <el-select
                v-model="dialogForm.categoryId"
                placeholder="请选择分类"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="category in categoryList"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="测评时长" prop="estimatedTime">
              <el-input v-model="dialogForm.estimatedTime" placeholder="例如：30分钟" clearable>
                <template #suffix>
                  <span class="input-suffix">分钟</span>
                </template>
              </el-input>
            </el-form-item>
          </div>
        </div>

        <!-- 问题设置 -->
        <div class="form-section">
          <div class="section-title">
            <i class="el-icon-question"></i>
            问题设置
          </div>
          <div class="section-content">
            <div class="questions-container">
              <div
                v-for="(question, index) in dialogForm.questions"
                :key="index"
                class="question-item"
                :class="{ 'question-item-error': questionErrors[index] }"
              >
                <div class="question-header">
                  <div class="question-number">
                    <span class="number-badge">{{ index + 1 }}</span>
                    <span class="question-title">问题 {{ index + 1 }}</span>
                  </div>
                  <el-button
                    type="danger"
                    size="small"
                    @click="removeQuestion(index)"
                    v-if="dialogForm.questions.length > 1"
                    icon="el-icon-delete"
                    circle
                  />
                </div>

                <div class="question-content">
                  <el-form-item
                    :label="`题目内容`"
                    :prop="`questions.${index}.question`"
                    :rules="[{ required: true, message: '请输入题目内容', trigger: 'blur' }]"
                  >
                    <el-input
                      v-model="question.question"
                      placeholder="请输入题目内容"
                      type="textarea"
                      :rows="2"
                      maxlength="200"
                      show-word-limit
                    />
                  </el-form-item>

                  <el-form-item
                    :label="`题目类型`"
                    :prop="`questions.${index}.type`"
                    :rules="[{ required: true, message: '请选择题目类型', trigger: 'change' }]"
                  >
                    <el-select
                      v-model="question.type"
                      placeholder="请选择题目类型"
                      style="width: 100%"
                      @change="handleQuestionTypeChange(index)"
                    >
                      <el-option label="🔘 单选题" value="SINGLE_CHOICE" />
                      <el-option label="☑️ 多选题" value="MULTIPLE_CHOICE" />
                      <el-option label="📝 文本题" value="TEXT" />
                      <el-option label="⭐ 评分题" value="SCALE" />
                    </el-select>
                  </el-form-item>

                  <el-form-item :label="`题目描述`">
                    <el-input
                      v-model="question.description"
                      type="textarea"
                      placeholder="请输入题目描述（可选）"
                      :rows="2"
                      maxlength="300"
                      show-word-limit
                    />
                  </el-form-item>

                  <div
                    v-if="question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE'"
                    class="options-container"
                  >
                    <div class="options-header">
                      <span class="options-title">📋 选项设置</span>
                      <el-button
                        type="primary"
                        size="small"
                        @click="addOption(index)"
                        icon="el-icon-plus"
                      >
                        添加选项
                      </el-button>
                    </div>
                    <div class="options-list">
                      <div
                        v-for="(option, optIndex) in question.options"
                        :key="optIndex"
                        class="option-item"
                      >
                        <div class="option-header">
                          <span class="option-label"
                            >选项 {{ String.fromCharCode(65 + optIndex) }}</span
                          >
                          <el-button
                            type="danger"
                            size="mini"
                            @click="removeOption(index, optIndex)"
                            v-if="question.options.length > 2"
                            icon="el-icon-close"
                            circle
                          />
                        </div>
                        <div class="option-inputs">
                          <el-input
                            v-model="option.text"
                            placeholder="选项显示文字"
                            class="option-input"
                          />
                          <el-input
                            v-model="option.value"
                            placeholder="选项值"
                            class="option-input option-value"
                          />
                          <el-input-number
                            v-model="option.score"
                            placeholder="分值"
                            :min="0"
                            :max="100"
                            :step="1"
                            :precision="0"
                            controls-position="right"
                            size="small"
                            class="option-score"
                            show-input
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="add-question-container">
                <el-button
                  type="primary"
                  @click="addQuestion"
                  class="add-question-btn"
                  icon="el-icon-plus"
                  size="large"
                >
                  添加问题
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <el-form-item label="评分规则" prop="scoringRules" v-if="!dialogForm.id">
          <div class="scoring-rules-container">
            <div class="rules-header">
              <span class="rules-title">📊 评分规则设置</span>
              <el-button
                type="primary"
                size="small"
                @click="addScoringRule"
                icon="el-icon-plus"
              >
                添加规则
              </el-button>
            </div>
            <div class="rules-list">
              <div
                v-for="(rule, key, index) in dialogForm.scoringRules.key"
                :key="index"
                class="rule-item"
              >
                <div class="rule-header">
                  <el-input
                    v-model="rule.name"
                    placeholder="规则名称"
                    class="rule-name-input"
                  />
                  <el-button
                    type="danger"
                    size="mini"
                    @click="removeScoringRule(index)"
                    icon="el-icon-close"
                    circle
                  />
                </div>
                <div class="rule-content">
                  <el-input
                    v-model="rule.description"
                    type="textarea"
                    placeholder="规则描述"
                    :rows="2"
                    maxlength="200"
                    show-word-limit
                  />
                  <div class="rule-scores">
                    <div class="score-item">
                      <span class="score-label">最低分：</span>
                      <el-input-number
                        v-model="rule.minScore"
                        :min="0"
                        :max="100"
                        :step="1"
                        :precision="0"
                        size="small"
                        placeholder="0"
                      />
                    </div>
                    <div class="score-item">
                      <span class="score-label">最高分：</span>
                      <el-input-number
                        v-model="rule.maxScore"
                        :min="0"
                        :max="100"
                        :step="1"
                        :precision="0"
                        size="small"
                        placeholder="100"
                      />
                    </div>
                    <div class="score-item">
                      <span class="score-label">评级：</span>
                      <el-input
                        v-model="rule.level"
                        placeholder="例如：优秀、良好、一般"
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="Object.keys(dialogForm.scoringRules.key).length === 0" class="no-rules">
                <i class="el-icon-info"></i>
                <span>暂无评分规则，请点击"添加规则"按钮创建</span>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" size="large">取消</el-button>
        <el-button type="primary" @click="handleSubmit" size="large" :loading="submitting">
          {{ title === "新增心理测评" ? "创建测评" : "保存修改" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
  <TestCategory ref="TestCategoryRef"></TestCategory>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import {
  GetTests,
  PostAddTests,
  GetTestsInfo,
  DeleteById,
  GetCategory,
  PutTests,
} from "@/api/tests";
import TestCategory from "@/components/CategoryComponents/TestCategory.vue";
import { ElMessage } from "element-plus";
const title = ref();
const dialogVisible = ref(false);
const userRole = ref(null);
const testsList = ref([]);
const TestCategoryRef = ref(null);
const categories = ref([]);

const testsForm = ref({
  categoryId: "",
  status: "",
  keyword: "",
  page: 1,
  size: 10,
});

const dialogForm = ref({
  id: "",
  title: "",
  categoryId: "",
  description: "",
  questions: [
    {
      id: 0,
      question: "",
      type: "SINGLE_CHOICE",
      options: [
        {
          value: "",
          text: "",
          score: 0,
        },
      ],
      description: "",
    },
  ],
  scoringRules: {
    key:{}
  },
  estimatedTime: "",
  takeCount: "",
  status: "",
  createdBy: "",
  createdAt: "",
  updatedAt: "",
});

// 表单验证规则
const formRules = ref({
  title: [
    { required: true, message: "请输入测评标题", trigger: "blur" },
    { min: 2, max: 100, message: "标题长度在 2 到 100 个字符", trigger: "blur" },
  ],
  description: [
    { required: true, message: "请输入测评描述", trigger: "blur" },
    { min: 5, max: 500, message: "描述长度在 5 到 500 个字符", trigger: "blur" },
  ],
  categoryId: [{ required: true, message: "请选择分类", trigger: "change" }],
  estimatedTime: [{ required: true, message: "请输入测评时长", trigger: "blur" }],
});

// 表单引用和状态
const formRef = ref(null);
const submitting = ref(false);
const questionErrors = ref({});
// 结果查询模态框状态
const showResultsModal = ref(false);
const selectedTestId = ref(null);
const resultSearchUsername = ref("");
const resultSearchAttempted = ref(false);
const searchedResults = ref([]); // 存储搜索到的结果

const getTests = async () => {
  await GetTests(testsForm.value).then((res) => {
    console.log(res);

    testsList.value = res.list;
  });
};
getTests();
onMounted(() => {
  // 权限获取逻辑 (保持不变)
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

// --- 模态框方法 ---
const openResultsModal = (testId) => {
  selectedTestId.value = testId;
  resultSearchUsername.value = ""; // 清空上次的搜索
  searchedResults.value = []; // 清空上次的结果
  resultSearchAttempted.value = false;
  showResultsModal.value = true;
};

const closeResultsModal = () => {
  showResultsModal.value = false;
};

// --- 测评管理方法 (权限控制) ---

const categoryList = ref([]);
// 获取分类数据
const loadCategoryData = async () => {
  try {
    const res = await GetCategory();
    console.log(res);
    categoryList.value = res;
    categories.value = res;
  } catch (error) {
    console.error("获取分类数据失败:", error);
    ElMessage.error("获取分类数据失败");
  }
};
loadCategoryData();
const fetchTests = () => {
  console.log(`[API] 正在调用 GET /admin/tests 或 /consultant/tests API 获取测评列表...`);
  testsForm.value.page = 1;
  getTests();
};

const handleAddTest = () => {
  console.log(`[UI] 跳转到新增测评页面。`);
  // 权限：ADMIN 和 CONSULTANT 都可以新增
  // API 参考：POST /admin/tests 或 /consultant/tests
  resetForm();

  // 确保scoringRules结构正确
  dialogForm.value.scoringRules = {
    key: {}
  };

  dialogVisible.value = true;
  title.value = "新增心理测评";
};

const handleEdit = async (id) => {
  // if (userRole.value !== "ADMIN") {
  //   alert("权限不足！只有系统管理员可以修改测评。");
  //   return;
  // }

  dialogVisible.value = true;
  title.value = "编辑心理测评";
  await GetTestsInfo(id).then((res) => {
    console.log(res);
    dialogForm.value = res;
  });
};

const handlePublish = async (id) => {
  if (userRole.value !== "ADMIN") {
    alert("权限不足！只有系统管理员可以发布测评。");
    return;
  }
  alert(`ADMIN 发布测评 ID: ${id}`);
  await PutTests(id);
};

const handleDelete = async (id) => {
  if (userRole.value !== "ADMIN") {
    alert("权限不足！只有系统管理员可以删除测评。");
    return;
  }
  if (confirm(`ADMIN 确定删除测评 ID: ${id} 吗？`)) {
    await DeleteById(id);
    getTests();
  }
};

const handleCategoryManage = () => {
  if (userRole.value !== "ADMIN") {
    alert("权限不足！只有系统管理员可以管理分类。");
    return;
  }
  TestCategoryRef.value.open();
  console.log("[UI] ADMIN 弹出或跳转到测评分类管理页面。");
};

// --- 结果查询方法 ---
const handleViewResults = async () => {
  if (!resultSearchUsername.value) {
    alert("请输入学生用户名 (学号) 进行搜索。");
    return;
  }

  resultSearchAttempted.value = true;

  // API 预留：查询某个量表下，某个用户的历史结果
  console.log(
    `[API] 正在查询测评 ID: ${selectedTestId.value} 中，学生 ${resultSearchUsername.value} 的结果...`
  );
  // API 参考：GET /admin/tests/{testId}/results?username={username}
  await GetTestsResults(resultSearchUsername.value);
  // 模拟返回数据
  if (resultSearchUsername.value === "100000002") {
    searchedResults.value = [
      { id: 101, username: "王小明", score: 85, date: "2024-10-01" },
      { id: 102, username: "王小明", score: 72, date: "2024-08-15" },
    ];
  } else {
    searchedResults.value = [];
  }
};

const handleResultDetail = (resultId) => {
  console.log(`[UI] 查看结果 ID: ${resultId} 详情。`);
};

// --- 问题管理方法 ---
const addQuestion = () => {
  const newQuestion = {
    id: dialogForm.value.questions.length,
    content: "",
    type: "SINGLE_CHOICE",
    options: [
      {
        value: "",
        label: "",
        score: 0,
      },
    ],
    description: "",
  };
  dialogForm.value.questions.push(newQuestion);
};

const removeQuestion = (index) => {
  if (dialogForm.value.questions.length > 1) {
    dialogForm.value.questions.splice(index, 1);
    // 重新设置id
    dialogForm.value.questions.forEach((question, idx) => {
      question.id = idx;
    });
  }
};

const addOption = (questionIndex) => {
  const newOption = {
    value: "",
    label: "",
    score: 0,
  };
  dialogForm.value.questions[questionIndex].options.push(newOption);
};

const removeOption = (questionIndex, optionIndex) => {
  if (dialogForm.value.questions[questionIndex].options.length > 1) {
    dialogForm.value.questions[questionIndex].options.splice(optionIndex, 1);
  }
};

// 题目类型改变时的处理
const handleQuestionTypeChange = (index) => {
  const question = dialogForm.value.questions[index];
  if (question.type === "TEXT" || question.type === "SCALE") {
    // 文本题和评分题不需要选项
    question.options = [];
  } else {
    // 选择题需要至少两个选项
    if (!question.options || question.options.length === 0) {
      question.options = [
        { value: "", label: "", score: 0 },
        { value: "", label: "", score: 0 },
      ];
    }
  }
};

// 表单提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    // 验证基本表单
    await formRef.value.validate();

    // 验证问题数据
    // const isValid = validateQuestions();
    // if (!isValid) {
    //   ElMessage.error("请完善问题设置");
    //   return;
    // }

    submitting.value = true;

    // 准备提交数据
    const submitData = {
      ...dialogForm.value,
      // 移除不需要的字段
      id: dialogForm.value.id || undefined,
      takeCount: undefined,
      status: undefined,
      createdBy: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };

    if (title.value === "新增心理测评") {
      await PostAddTests(submitData);
      ElMessage.success("测评创建成功");
    } else {
      // 编辑模式需要调用更新API
      await PutTests(dialogForm.value.id, submitData);
      ElMessage.success("测评更新成功");
    }

    dialogVisible.value = false;
    getTests(); // 刷新列表
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("提交失败，请检查表单数据");
  } finally {
    submitting.value = false;
  }
};

// 验证问题数据
const validateQuestions = () => {
  const questions = dialogForm.value.questions;
  const errors = {};

  questions.forEach((question, index) => {
    if (!question.content || question.content.trim() === "") {
      errors[index] = true;
      return;
    }

    if (!question.type) {
      errors[index] = true;
      return;
    }

    // 选择题需要验证选项
    if (question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") {
      if (!question.options || question.options.length < 2) {
        errors[index] = true;
        return;
      }

      question.options.forEach((option) => {
        if (!option.label || !option.value) {
          errors[index] = true;
          return;
        }
      });
    }
  });

  questionErrors.value = errors;
  return Object.keys(errors).length === 0;
};
// Dialog关闭前的回调，用于 el-dialog 的 :before-close 属性 【新增此函数以修复警告】
const handleClose = (done) => {
  // 调用取消操作执行清理和隐藏逻辑
  handleCancel();
  // 必须调用 done() 才能关闭 Dialog
  done();
};
// 取消操作
const handleCancel = () => {
  dialogVisible.value = false;
  // 重置表单
  resetForm();
};

// 评分规则管理方法
const addScoringRule = () => {
  const ruleId = Date.now().toString();
  if (!dialogForm.value.scoringRules.key) {
    dialogForm.value.scoringRules.key = {};
  }
  dialogForm.value.scoringRules.key[ruleId] = {
    name: "",
    description: "",
    minScore: 0,
    maxScore: 100,
    level: ""
  };
};

const removeScoringRule = (index) => {
  const keys = Object.keys(dialogForm.value.scoringRules.key);
  if (keys[index]) {
    delete dialogForm.value.scoringRules.key[keys[index]];
  }
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  questionErrors.value = {};
  // 重置为初始状态
  dialogForm.value = {
    id: "",
    title: "",
    categoryId: "",
    description: "",
    questions: [
      {
        id: 0,
        question: "",
        type: "SINGLE_CHOICE",
        options: [
          { value: "", label: "", score: 0 },
          { value: "", label: "", score: 0 },
        ],
        description: "",
      },
    ],
    scoringRules: {
      key: {}
    },
    estimatedTime: "",
    takeCount: "",
    status: "",
    createdBy: "",
    createdAt: "",
    updatedAt: "",
  };
};
</script>

<style scoped>
/* ************************************************* */
/* *************** 心理测评管理页面样式 (美化) ******* */
/* ************************************************* */

.test-management-page {
  padding: 20px;
  background-color: #f0f2f5;
  /* 略微浅灰的背景，更现代 */
  min-height: 100%;
}

.page-title {
  font-size: 26px;
  color: #2c3e50;
  margin-bottom: 25px;
  font-weight: 700;
  border-bottom: 3px solid #3b5998;
  /* 标题下划线更突出 */
  padding-bottom: 10px;
}

/* 问题管理样式 */
.questions-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  background-color: #fafafa;
}

.question-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  background-color: white;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
  color: #409eff;
}

.options-container {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
  color: #67c23a;
}

.option-item {
  margin-bottom: 10px;
}

.option-inputs {
  display: flex;
  align-items: center;
}

/* 对话框美化样式 */
.test-dialog {
  border-radius: 12px;
}

.test-dialog .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 30px;
  border-radius: 12px 12px 0 0;
}

.test-dialog .el-dialog__title {
  font-size: 18px;
  font-weight: 600;
}

.test-dialog .el-dialog__headerbtn .el-dialog__close {
  color: white;
  font-size: 20px;
}

.dialog-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 20px;
}

.test-form {
  padding: 20px 0;
}

.form-section {
  margin-bottom: 30px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.section-title {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 15px 20px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title i {
  font-size: 18px;
  color: #409eff;
}

.section-content {
  padding: 20px;
  background-color: #fafbfc;
}

/* 输入框美化 */
.test-form .el-input__inner,
.test-form .el-textarea__inner,
.test-form .el-select .el-input__inner {
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
}

.test-form .el-input__inner:focus,
.test-form .el-textarea__inner:focus,
.test-form .el-select .el-input__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.input-suffix {
  color: #909399;
  font-size: 12px;
}

/* 问题容器美化 */
.questions-container {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e8e8e8;
}

.question-item {
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: white;
  transition: all 0.3s ease;
  position: relative;
}

.question-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
}

.question-item-error {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.question-number {
  display: flex;
  align-items: center;
  gap: 12px;
}

.number-badge {
  background: linear-gradient(135deg, #409eff 0%, #36d1dc 100%);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.question-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.question-content {
  padding: 0 10px;
}

/* 选项容器美化 */
.options-container {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 8px;
  border: 1px solid #ffd4a3;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ffd4a3;
}

.options-title {
  font-weight: 600;
  color: #e65100;
  font-size: 15px;
}

.options-list {
  display: grid;
  gap: 15px;
}

.option-item {
  background: white;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #ffd4a3;
  transition: all 0.3s ease;
}

.option-item:hover {
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.2);
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.option-label {
  font-weight: 600;
  color: #e65100;
  font-size: 14px;
}

.option-inputs {
  display: grid;
  grid-template-columns: 2fr 1fr 120px;
  gap: 10px;
  align-items: center;
}

.option-input {
  border-radius: 4px;
}

.option-value {
  background-color: #f8f9fa;
}

.option-score {
  text-align: center;
  width: 120px;
}

.option-score .el-input__inner {
  text-align: center;
  font-weight: 600;
  color: #e65100;
  background-color: #fff8e1;
  border-color: #ffd4a3;
  font-size: 14px;
  padding-right: 35px;
}

.option-score .el-input__inner:focus {
  border-color: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.2);
}

.option-score .el-input-number__decrease,
.option-score .el-input-number__increase {
  background-color: #ff9800;
  color: white;
  border-color: #ff9800;
  border-radius: 0 4px 4px 0;
  width: 32px;
}

.option-score .el-input-number__decrease:hover,
.option-score .el-input-number__increase:hover {
  background-color: #f57c00;
}

.option-score .el-input-number__decrease.is-disabled,
.option-score .el-input-number__increase.is-disabled {
  background-color: #f5f5f5;
  color: #c0c4cc;
  border-color: #e4e7ed;
}

/* 评分规则样式 */
.scoring-rules-container {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.rules-title {
  font-weight: 600;
  color: #409eff;
  font-size: 16px;
}

.rules-list {
  max-height: 400px;
  overflow-y: auto;
}

.rule-item {
  background-color: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.rule-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.rule-name-input {
  flex: 1;
  margin-right: 12px;
}

.rule-name-input .el-input__inner {
  font-weight: 600;
  color: #303133;
}

.rule-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-scores {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  font-weight: 500;
}

.score-item .el-input-number {
  width: 100px;
}

.score-item .el-input {
  width: 150px;
}

.no-rules {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px dashed #dcdfe6;
}

.no-rules i {
  font-size: 24px;
  margin-bottom: 8px;
  display: block;
}

.no-rules span {
  font-size: 14px;
}

/* 添加问题按钮 */
.add-question-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px dashed #e8e8e8;
}

.add-question-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 25px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.add-question-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

/* 对话框底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  margin: 0 -20px -20px -20px;
  border-radius: 0 0 12px 12px;
}

.dialog-footer .el-button {
  border-radius: 20px;
  padding: 10px 30px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.dialog-footer .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.dialog-footer .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 滚动条美化 */
.dialog-content::-webkit-scrollbar {
  width: 8px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

/* 问题管理样式 */
.questions-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  background-color: #fafafa;
}

.question-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  background-color: white;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
  color: #409eff;
}

.options-container {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
  color: #67c23a;
}

.option-item {
  margin-bottom: 10px;
}

.option-inputs {
  display: flex;
  align-items: center;
}

/* --- 统计卡片布局 (美化) --- */

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

/* 颜色主题优化 */
.card-value {
  color: #3b5998;
}

.total-icon {
  background-color: #3b5998;
}

.card-value {
  color: #13c2c2;
}

.category-icon {
  background-color: #13c2c2;
}

.card-value {
  color: #52c41a;
}

.published-icon {
  background-color: #52c41a;
}

.card-value {
  color: #faad14;
}

.drafted-icon {
  background-color: #faad14;
}

/* --- 表格区域 --- */
.test-table-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  /* 阴影与卡片保持一致 */
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
  /* 增大内边距 */
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  height: 40px;
  transition: border-color 0.2s;
}

.filter-select:focus,
.search-input:focus {
  border-color: #3b5998;
  outline: none;
}

.search-input {
  width: 220px;
}

/* 按钮样式 (更精致) */
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
  transition: background-color 0.2s;
}

.search-btn {
  background-color: #3b5998;
}

.search-btn:hover {
  background-color: #4c69b0;
}

.action-btn-primary {
  background-color: #13c2c2;
}

/* 新增 */
.action-btn-primary:hover {
  background-color: #2ab8b8;
}

.action-btn-secondary {
  background-color: #8c9fae;
}

/* 管理分类/次要操作 */
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
  transition: background-color 0.3s;
}

.data-table tr:hover {
  background-color: #fcfcfc;
}

.data-table tbody tr td:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.data-table tbody tr td:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  /* 药丸形状 */
  font-weight: 600;
  font-size: 12px;
  color: white;
}

.status-published {
  background-color: #52c41a;
}

.status-draft {
  background-color: #bfbfbf;
}

/* 操作按钮 */
.action-btn {
  padding: 8px 12px;
  margin-right: 5px;
  border: 1px solid transparent;
  /* 默认透明边框 */
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.edit-btn {
  color: #1890ff;
  background: #e6f7ff;
}

.edit-btn:hover {
  background: #bfe6ff;
}

.result-btn {
  color: #faad14;
  background: #fffbe6;
}

.result-btn:hover {
  background: #fff1b8;
}

.delete-btn {
  color: white;
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}

.delete-btn:hover {
  background-color: #cf1322;
}

.publish-btn {
  color: white;
  background-color: #52c41a;
  border-color: #52c41a;
}

.publish-btn:hover {
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

.pagination button {
  padding: 8px 15px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pagination button:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.page-info {
  font-size: 14px;
  color: #595959;
}

/* --- 权限提示和警告 --- */
.permission-hint {
  background-color: #f0faff;
  border-left: 5px solid #1890ff;
  color: #1890ff;
  padding: 12px 20px;
  margin-bottom: 20px;
  border-radius: 4px;
  font-size: 14px;
}

.permission-alert {
  /* 保持与 UserManagementPage.vue 中的警告样式一致 */
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

/* --- 模态框样式 (结果查询) --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  /* 更深的背景遮罩 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.results-modal {
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 550px;
  max-height: 85vh;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease-out;
}

.results-modal h3 {
  font-size: 20px;
  color: #3b5998;
  margin-bottom: 20px;
  border-bottom: 2px solid #3b5998;
  padding-bottom: 10px;
}

.search-input-modal {
  width: 60%;
  padding: 10px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  margin-right: 10px;
}

.search-btn-modal {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  background-color: #52c41a;
  /* 使用绿色作为查询按钮 */
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-btn-modal:hover {
  background-color: #389e0d;
}

.result-list {
  margin-top: 25px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.result-list h4 {
  margin-bottom: 15px;
  color: #2c3e50;
  font-weight: 600;
}

.result-list li {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #595959;
}

.result-list li:last-child {
  border-bottom: none;
}

.close-btn {
  margin-top: 25px;
  padding: 10px;
  background-color: #f0f0f0;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #e6e6e6;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
