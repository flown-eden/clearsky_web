import request from '@/utils/request'

// 获取预约列表
export function GetAppointments(params){
  return request({
    url:`/appointments/my?page=${params.page}&size=${params.size}&consultantId=${params.consultantId}&status=${params.status}&createdAt=${params.createdAt}`,
    method:'get',
  })
}

// 强制拒绝
export function PutappointmentIdStatus(appointmentId,data){
  return request({
    url:`/appointments/${appointmentId}/cancel`,
    method:'put',
    data:data
  })
}

