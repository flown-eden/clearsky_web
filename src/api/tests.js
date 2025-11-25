import request from '@/utils/request'

// ------------------------------------
// 测评管理接口
// ------------------------------------

//  1. 查询测评列表 (GET /tests)
export function GetTests(params) {
  return request({
    url: `/tests?page=${params.page}&size=${params.size}&categoryId=${params.categoryId}&keyword=${params.keyword}&status=${params.status}`,
    method: 'get',
  })
}

// 2. 获取测评详情 (GET /tests/{testId})
export function GetTestsInfo(testId, params = {}) {
  // 考虑到接口文档中的可选参数 includeQuestions 和 includeScoringRules
  const query = new URLSearchParams(params).toString();
  const url = query ? `/tests/${testId}?${query}` : `/tests/${testId}`;
  return request({
    url: url,
    method: 'get',
  })
}

// 3. 创建心理测评（草稿） (POST /tests) 【新增】
export function PostCreateTestDraft(data) {
  return request({
    url: `/tests`,
    method: 'post',
    data: data
  })
}

// 4. 更新心理测评 (PUT /tests/{testId})
export function PutTests(testId, data) {
  return request({
    url: `/tests/${testId}`,
    method: 'put',
    data: data
  })
}

// 5. 删除测评 (DELETE /tests/{testId})
export function DeleteById(testId) {
  return request({
    url: `/tests/${testId}`,
    method: 'delete',
  })
}

// 6. 提交测评答案 (POST /tests/{testId}/submit) 【新增】
export function PostSubmitTestAnswers(testId, data) {
  return request({
    url: `/tests/${testId}/submit`,
    method: 'post',
    data: data
  })
}



// 8. 上传心理测评（直接发布） (POST /tests/upload)
// 注意：您原函数名为 PostAddTests，根据您提供的接口文档，此接口对应上传/直接发布
export function PostAddTests(data) {
  return request({
    url: `/tests/upload`,
    method: 'post',
    data: data
  })
}

// ------------------------------------
// 测评分类接口
// ------------------------------------

// 9. 查询分类 (GET /tests/categories)
export function GetCategory() {
  return request({
    url: `/tests/categories`,
    method: 'get',
  })
}

// 10. 添加分类 (POST /tests/categories)
export function PostAddCategory(data) {
  return request({
    url: `/tests/categories`,
    method: 'post',
    data: data
  })
}

// 11. 修改分类 (PUT /tests/categories/{categoryId})
export function PutCategory(categoryId, data) {
  return request({
    url: `/tests/categories/${categoryId}`,
    method: 'put',
    data: data
  })
}

// 12. 删除分类 (DELETE /tests/categories/{categoryId})
export function DeleteCategory(categoryId) {
  return request({
    url: `/tests/categories/${categoryId}`,
    method: 'delete',
  })
}