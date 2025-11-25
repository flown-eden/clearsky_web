<template>
  <el-dialog v-model="dialogVisible" fullscreen title="心理测评分类">
    <el-button type="primary" @click="add">添加分类</el-button>
    <el-table :data="categoryList" style="width: 100%">
      <el-table-column type="index" label="序号" width="120" />
      <el-table-column prop="name" label="分类名称" />
      <el-table-column prop="description" label="分类描述" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="edit(row)">编辑</el-button>
          <el-button type="danger" size="small" @click="deleteCategory(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog v-model="dialog" :title="title" width="500" :before-close="handleClose">
    <el-form :model="formData" ref="formRef" :rules="rules" label-width="auto" style="max-width: 600px">
      <el-form-item label="分类名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="分类描述" prop="description">
        <el-input v-model="formData.description" placeholder="请输入分类描述" />
      </el-form-item>

    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm"> 确定 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from "vue";
import { GetCategory, PostAddCategory, PutCategory, DeleteCategory } from "@/api/tests.js";
import { ElMessage } from "element-plus";

// 状态管理
const dialog = ref(false);
const dialogVisible = ref(false);
const categoryList = ref([]);
const currentId = ref(null);
const formRef = ref(null);
const title = ref("");
// 表单数据
const formData = ref({
  name: "",
  description: "",

});

// 表单验证规则
const rules = ref({
  name: [
    { required: true, message: '分类名称不能为空', trigger: 'blur' },
    { min: 1, max: 100, message: '分类名称长度应在1-100个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '分类描述不能为空', trigger: 'blur' }
  ],

});

// 获取分类数据
const loadCategoryData = async () => {
  try {
    const res = await GetCategory();
    console.log(res);
    categoryList.value = res;
  } catch (error) {
    console.error("获取分类数据失败:", error);
    ElMessage.error("获取分类数据失败");
  }
};

// 重置表单
const resetForm = () => {
  formData.value = {
    name: "",
    description: "",

  };
  currentId.value = null;
  if (formRef.value) {
    formRef.value.resetFields();
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
  console.log(row);

  currentId.value = row.id;
  formData.value = {
    name: row.name || "",
    description: row.description || "",

  };
  dialog.value = true;
  title.value = "编辑分类";
};

// 删除分类
const deleteCategory = async (row) => {
  try {
    await DeleteCategory(row.id);
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
const handleClose = (done) => {
  // 确保在关闭对话框时重置表单
  resetForm(); 
  title.value = "";
  // 必须调用 done() 才能关闭 Dialog
  done();
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
      description: formData.value.description,
      sort_order: formData.value.sortOrder
    };

    if (currentId.value) {
      // 编辑模式
      await PutCategory(currentId.value, submitData);
      ElMessage.success("修改成功");
    } else {
      // 添加模式
      await PostAddCategory(submitData);
      ElMessage.success("添加成功");
    }

    // 重新加载数据
    await loadCategoryData();
    // 关闭对话框
    dialog.value = false;
  } catch (error) {
    // 表单验证失败会抛出error === false
    if (error !== false) {
      console.error("提交失败:", error);
      ElMessage.error("操作失败，请重试");
    }
  }
};

// 取消表单
// const cancelForm = () => {
//   isFormVisible.value = false;
//   resetForm();
// };

// 打开对话框
const open = () => {
  dialogVisible.value = true;

  loadCategoryData();
};

// 初始化时加载数据
loadCategoryData();

defineExpose({
  open,
});
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
