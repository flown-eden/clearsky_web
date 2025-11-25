import request from '@/utils/request'

// ------------------------------------
// 会话列表与详情
// ------------------------------------

// 1. 获取会话列表 (分页 + 筛选) - 修正为管理员/咨询师接口
export function GetActiveConversations(params) {
  // 处理查询参数，确保 undefined 的参数不发送
  const query = new URLSearchParams();
  query.append('page', params.page || 1);
  query.append('size', params.size || 10);
  if (params.status) query.append('status', params.status);

  // 新增风险等级筛选参数
  if (params.riskLevel) query.append('riskLevel', params.riskLevel);

  // 修正 URL 为 /ai/conversations/admin/all
  return request({
    url: `/ai/conversations/admin/all?${query.toString()}`,
    method: 'get'
  })
}

// 2. 获取会话详情 (包含消息记录)
export function GetConversationDetail(conversationId) {
  return request({
    url: `/ai/conversations/${conversationId}`,
    method: 'get'
  })
}

// ------------------------------------
// 干预与操作
// ------------------------------------

// 3. 管理员接管对话 (路径: /ai/conversations/{conversationId}/admin-takeover)
export function PostAdminTakeover(conversationId, data) {
  return request({
    url: `/ai/conversations/${conversationId}/admin-takeover`,
    method: 'post',
    data: data // { reason: string, content: string }
  })
}

// 4. 发送回复 (接管后，ADMIN/CONSULTANT 可用)
export function PostReply(conversationId, data) {
  return request({
    url: `/ai/conversations/${conversationId}/reply`,
    method: 'post',
    data: data // { content: string, messageType: "TEXT" }
  })
}
// 5. 结束会话
export function PostEndConversation(conversationId) {
  return request({
    // 使用您指定的路径：/ai/conversations/{conversationId}/end
    url: `/ai/conversations/${conversationId}/end`,
    method: 'post'
  })
}