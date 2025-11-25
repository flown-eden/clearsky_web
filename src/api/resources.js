import request from '@/utils/request'

// 获取资源列表
// 修改前：手动拼接导致 undefined
// 修改后：使用 params 对象，axios 会自动忽略 undefined 的参数
export function GetResources(params) {
    return request({
        url: '/resources',
        method: 'get',
        params: params // 关键修改：把参数交给 axios 处理
    })
}

// 删除资源
export function DeleteById(resourceId) {
    return request({
        url: `/resources/${resourceId}`,
        method: 'delete'
    })
}
//获取资源详情
export function GetResourcesId(resourceId) {
    return request({
        url: `/resources/${resourceId}`,
        method: 'get'
    })
}
//更新资源
export function PutResourcesId(resourceId, data) {
    return request({
        url: `/resources/${resourceId}`,
        method: 'put',
        data: data
    })
}
//上传心理资源（直接发布）
export function PostAddResources(data) {
    return request({
        url: `/resources/upload`,
        method: 'post',
        data: data
    })
}
//获取资源分类
export function GetResourceCategories() {
    return request({
        url: `/resources/categories`,
        method: 'get'
    })
}
//更新资源分类
export function PutResourceCategories(categoryId, data) {
    return request({
        url: `/resources/categories/${categoryId}`,
        method: 'put',
        data: data
    })
}
//创建资源分类
export function PostResourceCategories(data) {
    return request({
        url: `/resources/categories`,
        method: 'post',
        data: data
    })
}
//删除资源分类
export function DeleteResourceCategories(categoryId) {
    return request({
        url: `/resources/categories/${categoryId}`,
        method: 'delete'
    })
}