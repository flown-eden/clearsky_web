import axios from "axios";
import { useUserStore } from '@/stores/user'

const service =  axios.create({
  baseURL :'/api',
  timeout: 1000000,//10分钟
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 添加 token 到请求头
    const userStore = useUserStore();
    const token = userStore.token
    if (token) {
      config.headers.Authorization = 'Bearer '+token;
    }
    return config;
  },
  (error) => {
    // 请求错误处理
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const { data, code, message } = response.data;
    // 根据状态码判断请求结果
    if (code == 200) {
      return data;
    }

    // 处理业务错误
    return Promise.reject( message||new Error('服务异常，请稍后重试'));
  },
  (error) => {
    const { response } = error;

    if (response){
      const { status, data } = response;


      if(status ==403){
        alert('没有权限访问该资源');
      }else {
        alert(data?.message || '服务异常，请稍后重试');
      }
    }else{
    }
    return Promise.reject(error);
  }
);



export default service;
