<template>
  <el-dialog v-model="dialogVisible" fullscreen title="心理资源分类管理">
    <el-button type="primary" @click="add">添加分类</el-button>
    <el-table :data="categoryList" style="width: 100%">
      <el-table-column type="index" label="序号" width="120" />
      <el-table-column prop="name" label="分类名称" />
      <el-table-column prop="type" label="分类类型">
        <template #default="{ row }">
          <div v-for="(i, index) in typeOptions" :key="index">
            <span v-if="row.type === i.value">{{ i.label }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="edit(row)">编辑</el-button>
          <el-button type="danger" size="small" @click="deleteCategory(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog v-model="dialog" :title="title" width="500" :before-close="handleClose">
    <el-form :model="formData" ref="formRef" :rules="rules" label-width="auto" style="max-width: 600px">
      <el-form-item label="分类名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="分类类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择分类类型">
          <el-option v-for="i in typeOptions" :key="i.value" :label="i.label" :value="i.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="submitForm"> 确定 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from "vue";
import {
  GetResourceCategories,
  PutResourceCategories,
  PostResourceCategories,
  DeleteResourceCategories
} from "@/api/resources.js";
import { ElMessage } from "element-plus";

// 状态管理
const dialog = ref(false);         // 控制“编辑/新增”小弹窗
const dialogVisible = ref(false);  // 控制“列表”全屏大弹窗
const categoryList = ref([]);
const currentId = ref(null);
const formRef = ref(null);
const title = ref("");

// 表单数据
const formData = ref({
  name: "",
  type: "",
});

const typeOptions = ref([
  { label: '文章', value: 'ARTICLE' },
  { label: '视频', value: 'VIDEO' },
  { label: '音频', value: 'MUSIC' },
]);

// 表单验证规则
const rules = ref({
  name: [
    { required: true, message: '分类名称不能为空', trigger: 'blur' },
    { min: 1, max: 100, message: '分类名称长度应在1-100个字符之间', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择分类类型', trigger: 'change' }
  ],
});

// 获取分类数据
const loadCategoryData = async () => {
  try {
    const res = await GetResourceCategories();
    // 兼容处理：如果返回的是对象且包含 data，或者直接是数组
    const list = Array.isArray(res) ? res : (res.data || []);
    categoryList.value = list;
  } catch (error) {
    console.error("获取分类数据失败:", error);
    // ElMessage.error("获取分类数据失败");
  }
};

// 重置表单
const resetForm = () => {
  formData.value = {
    name: "",
    type: "",
  };
  currentId.value = null;
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 新增：处理内层弹窗关闭
const handleClose = (done) => {
  dialog.value = false;
  resetForm();
  if (typeof done === 'function') {
    done();
  }
};

// 添加分类
const add = () => {
  resetForm();
  dialog.value = true;
  title.value = "添加分类";
};

// 编辑分类
const edit = (row) => {
  currentId.value = row.id;
  formData.value = {
    name: row.name || "",
    type: row.type || "",
  };
  dialog.value = true;
  title.value = "编辑分类";
};

// 删除分类
const deleteCategory = async (row) => {
  if (!confirm("确定要删除这个分类吗？")) return;
  
  try {
    await DeleteResourceCategories(row.id);
    ElMessage.success("删除成功");
    // 重新加载数据
    await loadCategoryData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除分类失败:", error);
      ElMessage.error("删除失败，请重试");
    }
  }
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  try {
    // 执行表单验证
    await formRef.value.validate();

    // 准备提交数据
    const submitData = {
      name: formData.value.name,
      type: formData.value.type,
    };

    if (currentId.value) {
      // 编辑模式
      await PutResourceCategories(currentId.value, submitData);
      ElMessage.success("修改成功");
    } else {
      // 添加模式
      await PostResourceCategories(submitData);
      ElMessage.success("添加成功");
    }

    // 重新加载数据
    await loadCategoryData();
    // 关闭对话框
    handleClose(); 
  } catch (error) {
    // 表单验证失败会抛出error === false
    if (error !== false) {
      console.error("提交失败:", error);
      ElMessage.error("操作失败，请重试");
    }
  }
};

// 打开对话框 (供父组件调用)
const open = () => {
  dialogVisible.value = true;
  // 修复：原先这里写了 isFormVisible.value = false，但该变量未定义
  // 改为重置内层弹窗状态
  dialog.value = false; 
  loadCategoryData();
};

// 初始化时加载数据 (可选，因为 open 也会加载)
// loadCategoryData();

defineExpose({
  open,
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>