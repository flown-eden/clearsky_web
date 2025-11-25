import request from '@/utils/request'

// ------------------------------------
// 1. 基础信息
// ------------------------------------

// 获取当前咨询师ID
export function GetCurrentConsultantId() {
  return request({
    url: '/consultant/id',
    method: 'get'
  })
}

// ------------------------------------
// 2. 预约管理 (Consultant Appointments)
// ------------------------------------

// 获取预约列表
export function GetConsultantList(params){
    const query = new URLSearchParams();
    query.append('page', params.page || 1);
    query.append('size', params.size || 10);
    if (params.status) query.append('status', params.status);
    if (params.searchKeyword) query.append('userNameKeyword', params.searchKeyword); // 假设后端支持关键字搜索

    return request({
        url:`/consultant/appointments?${query.toString()}`,
        method:'get'
    })
}

// 审核预约 (Review: 确认/拒绝)
// 对应接口: PUT /api/v1/appointments/{id}/review
export function PutReviewAppointment(appointmentId, data){
    return request({
        url:`/appointments/${appointmentId}/review`,
        method:'put',
        data // { action: "CONFIRM" | "CANCEL", notes: "..." }
    })
}

// 更新预约状态 (Status: 完成/取消)
// 对应接口: PUT /api/v1/consultant/appointments/{id}/status
export function PutUpdateStatus(appointmentId, status, notes = ''){
    const query = new URLSearchParams();
    query.append('status', status);
    if (notes) query.append('notes', notes);

    return request({
        url:`/consultant/appointments/${appointmentId}/status?${query.toString()}`,
        method:'put'
    })
}

// ------------------------------------
// 3. 排班管理 (Schedule)
// ------------------------------------

// 添加排班
export function PostAddSchedule(data){
    return request({
        url:`/consultant/schedules`,
        method:'post',
        data // { scheduleDate, startTime, endTime, maxAppointments }
    })
}

// 查询排班列表 (获取可预约时间)
export function GetConsultantSchedules(consultantId, params) {
  const query = new URLSearchParams();
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  return request({
    url: `/consultants/${consultantId}/schedules?${query.toString()}`,
    method: 'get'
  })
}

// 删除排班
export function DeleteSchedule(scheduleId){
    return request({
        url:`/consultant/schedules/${scheduleId}`,
        method:'delete'
    })
}