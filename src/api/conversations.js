import request from '@/utils/request'

// 数据刷新  /admin/active-conversations
export function GetActiveConversations(params){
  return request({
    url:`/ai/conversations?page=${params.page}&size=${params.size}&status=${params.status}`,
    method:'get'
  })
}

// 强制结束  POST /admin/conversations/${id}/force-end`
export function PostForceEnd(id){
  return request({
    url:`/admin/conversations/${id}/force-end`,
    method:'post'
  })
}
