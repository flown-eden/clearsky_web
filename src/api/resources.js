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

// 下面这几个不需要动，但为了保持文件完整性，您确认一下即可
export function DeleteById(resourceId){
    return request({
        url:`/resources/${resourceId}`,
        method:'delete'
    })
}

export function GetResourcesId(resourceId){
    return request({
        url:`/resources/${resourceId}`,
        method:'get'
    })
}

export function PutResourcesId(resourceId,data){
    return request({
        url:`/resources/${resourceId}`,
        method:'put',
        data:data
    })
}

export function PostAddResources(data){
    return request({
        url:`/resources/upload`,
        method:'post',
        data:data
    })
}

export function GetResourceCategories(){
    return request({
        url:`/resources/categories`,
        method:'get'
    })
}

export function PutResourceCategories(categoryId,data){
    return request({
        url:`/resources/categories/${categoryId}`,
        method:'put',
        data:data
    })
}

export function PostResourceCategories(data){
    return request({
        url:`/resources/categories`,
        method:'post',
        data:data
    })
}

export function DeleteResourceCategories(categoryId){
    return request({
        url:`/resources/categories/${categoryId}`,
        method:'delete'
    })
}