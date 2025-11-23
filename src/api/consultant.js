import request from '@/utils/request'


export function GetConsultantList(params){
    return request({
        url:`/consultant/appointments?page=${params.page}&size=${params.size}`,
        method:'get'
    })
}

export function putConsultantAppointmentDetail(appointmentId,data){
    return request({
        url:`/appointments/${appointmentId}/review`,
        method:'put',
        data
    })
}

// 修改预约状态
export function putConsultantAppointmentStatus(appointmentId,status){
    return request({
        url:`/consultant/appointments/${appointmentId}/status`,
        method:'put',
        params:{status:status}
    })
}

// 添加排班/consultant/schedules
export function PostAddSchedule(data){
    return request({
        url:`/consultant/schedules`,
        method:'post',
        data
    })
}

// 获取排班
export function GetScheduleList(consultantId){
    return request({
        url:`/consultants/${consultantId}`,
        method:'get'
    })
}

// 删除排班
export function DeleteSchedule(scheduleId){
    return request({
        url:`/consultant/schedule/${scheduleId}`,
        method:'delete'
    })
}
