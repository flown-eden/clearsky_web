import request from '@/utils/request'
//管理员获取仪表盘数据
export function GetDashboard(){
  return request({
    url: '/admin/dashboard',
    method: 'get',
  })
}
//咨询师获取仪表盘数据
export function GetConsultant(){
  return request({
    url: '/consultant/dashboard',
    method: 'get',
  })

}
