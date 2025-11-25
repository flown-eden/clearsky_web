import request from '@/utils/request'

// ------------------------------------
// 预约查询与管理 (Consultant Appointments)
// ------------------------------------

// 1. 查询当前咨询师相关预约 (分页 + 筛选)
export function GetConsultantAppointments(params) {
  const query = new URLSearchParams();
  query.append('page', params.page || 1);
  query.append('size', params.size || 10);
  
  // 可选筛选参数
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.status) query.append('status', params.status);
  if (params.userNameKeyword) query.append('userNameKeyword', params.userNameKeyword);

  return request({
    url: `/consultant/appointments?${query.toString()}`,
    method: 'get'
  })
}

// 2. 审核预约 (确认/完成/取消)
export function PutReviewAppointment(appointmentId, data) {
  return request({
    url: `/appointments/${appointmentId}/review`,
    method: 'put',
    data: data // { action: "CONFIRM" | "COMPLETE" | "CANCEL", notes: string }
  })
}

// 3. 更新预约状态 (直接更新)
export function PutUpdateStatus(appointmentId, params) {
    const query = new URLSearchParams();
    query.append('status', params.status);
    if (params.notes) query.append('notes', params.notes);

    return request({
        url: `/consultant/appointments/${appointmentId}/status?${query.toString()}`,
        method: 'put'
    })
}