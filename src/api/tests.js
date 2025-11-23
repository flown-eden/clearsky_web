import request from '@/utils/request'



//  获取测评列表
export function GetTests(params){
  return request({
    url: `/tests?page=${params.page}&size=${params.size}&categoryId=${params.categoryId}&keyword=${params.keyword}&status=${params.status}`,
    method: 'get',
  })
}
// 删除测评
export function DeleteById(testId){
  return request({
    url: `/tests/${testId}`,
    method: 'delete',
  })
}

// 添加测评  /admin/tests
export function PostAddTests(data){
  return request({
    url: `/tests/upload`,
    method: 'post',
    data: data
  })
}
// 根据id查询详细
export function GetTestsInfo(testId){
  return request({
    url: `/tests/${testId}`,
    method: 'get',
  })
}

export function PutTests(testId,data){
  return request({
    url: `/tests/${testId}`,
    method: 'put',
    data: data
  })
}


// 查询分类
export function GetCategory(){
  return request({
    url: `/tests/categories`,
    method: 'get',
  })
}

// 添加分类
export function PostAddCategory(data){
  return request({
    url: `/tests/categories`,
    method: 'post',
    data: data
  })
}

// 修改分类
export function PutCategory(categoryId,data){
  return request({
    url: `/tests/categories/${categoryId}`,
    method: 'put',
    data: data
  })
}

// 删除分类
export function DeleteCategory(categoryId){
  return request({
    url: `/tests/categories/${categoryId}`,
    method: 'delete',
  })
}
