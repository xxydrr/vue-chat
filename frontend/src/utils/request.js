/**
 * axios封装
 * 请求拦截、响应拦截、错误统一处理
 */
import axios from 'axios'
import {Toast} from 'vant'
import {tokenCache, userInfoCache, sysInfoCache, conversationsListCache, sysNewsListCache} from '@/utils/cache'
/**
 * 提示函数
 * 禁止点击蒙层、显示一秒后关闭
 */

const tip = (msg, type = '') => {
  if (type === 'success') {
    return Toast({
      type: 'success',
      message: msg,
      duration: 1000,
      forbidClick: true
    })
  }
  Toast({
    type: 'fail',
    message: msg,
    duration: 1000,
    forbidClick: true
  })
}

/**
 * 跳转登录页
 * 携带当前页面路由，以期在登录页面完成登录后返回当前页面
 */
const toLogin = () => {
  window.location.href = '/#/login'
}

/**
 * 请求失败后的错误统一处理
 * @param {Number} status 请求失败的状态码
 */
const errorHandle = (status, other) => {
  // 状态码判断
  switch (status) {
    // 401: 未登录状态，跳转登录页
    case 401:
      toLogin()
      break
    // 403 token过期
    // 清除token并跳转登录页
    case 403:
      tip('登录过期，请重新登录')
      tokenCache.deleteCache()
      userInfoCache.deleteCache()
      sysInfoCache.deleteCache()
      conversationsListCache.deleteCache()
      sysNewsListCache.deleteCache()
      // store.commit('loginSuccess', null);

      setTimeout(() => {
        toLogin()
      }, 1000)
      break
    // 404请求不存在
    case 404:
      tip('请求的资源不存在')
      break
    default:
      console.log(other)
  }
}

// 创建axios实例
const instance = axios.create({
  timeout: 5000,
  withCredentials: true,
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 5000
})
// 设置post请求头
// instance.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
/**
 * 请求拦截器
 * 每次请求前，如果存在token则在请求头中携带token
 */
instance.interceptors.request.use(
  config => {
    // 登录流程控制中，根据本地是否存在token判断用户的登录情况
    // 但是即使token存在，也有可能token是过期的，所以在每次的请求头中携带token
    // 后台根据携带的token判断用户的登录情况，并返回给我们对应的状态码
    // 而后我们可以在响应拦截器中，根据状态码进行一些统一的操作。
    const token = tokenCache.getCache()
    // console.log(token);
    // token && (config.headers.Authorization = token);
    token && (config.headers['Authorization'] = `Bearer ${token}`)
    return config
  },
  error => Promise.error(error)
)

// 响应拦截器
instance.interceptors.response.use(
  response => {
    const res = response.data
    // 你只需改动的是这个 succeeCode ，因为每个项目的后台返回的code码各不相同
    if (res.code === 200) {
      return res
    } else if (res.startsWith('<svg xmlns')) {
      return res
    } else {
      tip(res.msg)
      return Promise.reject(res)
    }
  },
  // 请求失败
  error => {
    tip(error.message)
    return Promise.reject(error)
  }
)

export default instance