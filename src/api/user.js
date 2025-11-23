import request from '@/utils/request'

// 获取用户列表
export function GetUsers(params){
    return request({
     url:`/admin/users?page=${params.page}&size=${params.size}&role=${params.role}&status=${params.status}&keyword=${params.keyword}`,
     method:'get'
    })
}

// 根据id查询用户详情
export function GetByUserId(userId){
    return request({
        url:`/users/${userId}`,
        method:'get'
    })
}

// 根据用户id修改用户状态
export function PutByUserIdStatus(userId,data){
    return request({
        url: `/admin/users/${userId}/status`,
        method:'put',
        data:data
    })
}

// ---------------- 新增 API (用于 UserManagementPage.vue) ----------------

// 查询待审核的咨询师列表 (GET /api/v1/admin/consultants/pending)
export function GetPendingConsultants(){
    return request({
        url:'/admin/consultants/pending',
        method:'get'
    })
}

// 审核咨询师 (PUT /api/v1/admin/consultants/{consultantId}/review)
// data 格式: { action: 'APPROVE' | 'REJECT', reason: '...' }
export function PutConsultantReview(consultantId, data){
    return request({
        url:`/admin/consultants/${consultantId}/review`,
        method:'put',
        data:data
    })
}
// 上传心理咨询师信息 (POST /api/v1/consultants/upload)
export function PostConsultantUpload(data) {
    return request({
        url: '/consultants/upload',
        method: 'post',
        data: data
    });
}

// 检查用户是否为已认证咨询师 (GET /api/v1/consultants/check-approved/{userId})
export function CheckConsultantApproved(userId) {
    return request({
        url: `/consultants/check-approved/${userId}`,
        method: 'get'
    });
}

// 根据ID获取咨询师详情 (GET /consultants/{consultantId})
export function GetConsultantInfo(consultantId){
    return request({
        url:`/consultants/${consultantId}`,
        method:'get'
    })
}

// 查询咨询师列表 (GET /api/v1/consultants)
export function GetConsultants(params) {
    return request({
        url: '/consultants',
        method: 'get',
        params: params // params 会自动拼接成 url?page=1&size=10...
    })
}