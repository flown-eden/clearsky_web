import request from '@/utils/request'

// 获取博文列表 (通用接口，支持筛选、分页)
export function GetCommunity (params){
    // 使用 request 的 params 字段自动处理查询参数，更健壮
    return request({
        url:'/community/posts', 
        method:'get',
        params: params
    })
}

// 获取待审核博文列表 (Admin专用，不分页)
export function GetAdminPendingPosts (){
    return request({
        url:'/admin/posts/pending',
        method:'get'
    })
}

// 根据id修改博文状态（审核操作）
export function PutCommunityById(id, newStatusObject){
    const postId = id;
    const status = newStatusObject.status; // 'APPROVED' 或 'REJECTED'
    let action = '';

    // 关键修复：将状态映射为后端期望的动作动词
    if (status === 'APPROVED') {
        action = 'APPROVE';
    } else if (status === 'REJECTED') {
        action = 'REJECT';
    } else {
        console.error("审核操作状态错误:", status);
        // 如果传入了其他状态，为安全起见不执行请求
        return Promise.reject(new Error('Invalid status for review action.'));
    }
    
    // 构造符合 OpenAPI 规范的请求体
    const requestBody = {
        action: action, // 传入修正后的动作
        reason: '' // 保持空字符串
    };
    
    return request({
        // URL 修复：去掉开头的 /api，只保留 /v1/admin/posts/{postId}/review
        url:`/admin/posts/${postId}/review`,
        method:'put',
        data: requestBody
    })
}

// 根据id删除博文
export function DeleteById(postId){
    return request({
        url:`/community/posts/${postId}`,
        method:'delete'
    })
}

// 根据id查询博文详情 (保持 Admin 详情逻辑)
export function GetPostsInfo(postId, isAdminView){
    let url = `/community/posts/${postId}`;
    
    // 如果是管理员视图，切换到管理员详情接口
    if (isAdminView) {
        url = `/admin/community/posts/${postId}`; 
    }

    return request({
      url: url,
      method:'get'
    })
}

// 获取博文统计信息 community/posts/statistics
export function GetStatistics() {
  return request({
    url:`/community/posts/statistics`,
    method:'get'
  })
}