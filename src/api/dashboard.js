import request from '@/utils/request'

export function GetDashboard(){
  return request({
    url: '/admin/dashboard',
    method: 'get',
  })
}

export function GetConsultant(){
  return request({
    url: '/consultant/dashboard',
    method: 'get',
  })

}
