  import request from '@/utils/request'

// 登录
export function PostLogin(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

// 注册
export function PostRegister(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

// 修改/忘记密码
export function PutPassword(data) {
  return request({
    url: '/auth/password',
    method: 'put',
    data
  })
}
