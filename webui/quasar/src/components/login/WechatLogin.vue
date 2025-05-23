<template>
  <q-card class='q-mt-xl q-mb-xl border-radius-16px' style='width: 400px'>
    <q-card-section class='text-center'>
      <h4 class='q-mb-md'>微信扫码登录</h4>
      <div class='q-pa-md'>
        <div v-if='loading' class='q-mb-md'>
          <q-spinner-gears size='50px' />
        </div>
        <div v-else>
          <div class='q-mb-md relative'>
            <q-img
              :src='qrcodeUrl'
              alt='微信登录二维码'
              class='mx-auto rounded border-2 border-gray-200'
            />
            <!-- 状态指示浮层 -->
            <div
              v-if='scanStatus === 1'
              class='absolute inset-0 flex items-center justify-center bg-white/80 rounded'
            >
              <div class='text-center'>
                <q-icon name='check_circle' color='green' size='3em' />
                <p class='text-green font-medium mt-2'>已扫码，请在手机上确认</p>
              </div>
            </div>
            <div
              v-if='scanStatus === 2'
              class='absolute inset-0 flex items-center justify-center bg-white/80 rounded'
            >
              <div class='text-center'>
                <q-icon name='check_circle' color='green' size='3em' />
                <p class='text-green font-medium mt-2'>登录成功，正在跳转...</p>
              </div>
            </div>
          </div>
          <p class='text-caption'>请使用微信扫码登录</p>
          <q-btn
            flat
            v-if='!loading && !scanStatus'
            label='刷新二维码'
            @click='refreshQrcode'
            class='q-mt-sm text-blue-6'
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang='ts' setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { createQRCode } from './qrcode'

const $q = useQuasar()
const loading = ref(true)
const qrcodeUrl = ref('')
const scanStatus = ref(0) // 0: 未扫码, 1: 已扫码, 2: 已确认
const timer = ref(-1)
const wechatLoginUrl = ref('')

// 微信开放平台配置
const WECHAT_APPID = 'wx15b03327181a5fa4' // 替换为你的微信AppID
const REDIRECT_URI = encodeURIComponent(window.location.origin + '/wechat/callback') // 回调URL
const SCOPE = 'snsapi_login' // 网页授权作用域
const STATE = `wechat_login_${Date.now()}` // 防CSRF状态值

onMounted(async () => {
  // 检查URL中是否有微信返回的code
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const error = urlParams.get('error')

  if (error) {
    $q.notify({
      type: 'negative',
      message: `微信登录错误: ${error}`
    })
    loading.value = false
    return
  }

  if (code) {
    // 有code参数，说明是微信回调回来的
    await handleWechatCallback(code)
  } else {
    // 没有code，生成登录二维码
    generateWechatLoginUrl()
  }
})

onUnmounted(() => {
  // 清除定时器
  if (timer.value) {
    clearInterval(timer.value)
  }
})

// 生成微信登录URL并创建二维码
const generateWechatLoginUrl = () => {
  wechatLoginUrl.value = `https://open.weixin.qq.com/connect/oauth2/authorize?
                          appid=${WECHAT_APPID}&
                          redirect_uri=${REDIRECT_URI}&
                          response_type=code&
                          scope=${SCOPE}&
                          state=${STATE}#wechat_redirect`.replace(/\s+/g, '')

  // 使用qrcode.js生成二维码图片
  createQRCode(wechatLoginUrl.value)
    .then(url => {
      qrcodeUrl.value = url
      loading.value = false

      // 开始轮询检查扫码状态
      startPollingScanStatus()
    })
    .catch(error => {
      console.error('生成二维码失败:', error)
      $q.notify({
        type: 'negative',
        message: '生成二维码失败，请重试'
      })
      loading.value = false
    })
}

// 开始轮询检查扫码状态
const startPollingScanStatus = () => {
  // 这里使用localStorage模拟扫码状态
  // 在实际应用中，应该通过WebSocket或轮询后端API来获取真实状态
  timer.value = window.setInterval(() => {
    const mockStatus = localStorage.getItem('wechat_scan_status')

    if (mockStatus) {
      scanStatus.value = parseInt(mockStatus)

      if (scanStatus.value === 2) {
        // 登录成功，清除定时器
        window.clearInterval(timer.value)
        timer.value = -1
      }
    }
  }, 2000)
}

// 刷新二维码
const refreshQrcode = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = -1
  }

  scanStatus.value = 0
  loading.value = true
  generateWechatLoginUrl()
}

// 处理微信回调
const handleWechatCallback = async (code: string) => {
  try {
    loading.value = true

    // 这里应该调用后端API，将code发送到后端换取access_token和用户信息
    // 为了示例，这里使用fetch模拟调用后端API
    const response = await fetch('/api/auth/wechat/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    })

    if (!response.ok) {
      throw new Error('登录失败')
    }

    const data = await response.json() as Record<string, unknown>

    // 登录成功，保存token
    localStorage.setItem('token', data.token as string)
    localStorage.setItem('user', JSON.stringify(data.user))

    // 更新扫码状态
    localStorage.setItem('wechat_scan_status', '2')
    scanStatus.value = 2

    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      window.location.href = '/'
    }, 1500)
  } catch (error) {
    console.error('微信登录错误:', error)
    $q.notify({
      type: 'negative',
      message: '微信登录失败，请重试'
    })
    loading.value = false
  }
}

// 监听扫码状态变化
watch(scanStatus, (newVal) => {
  if (newVal === 1) {
    $q.notify({
      type: 'info',
      message: '已扫码，请在手机上确认登录'
    })
  }
})
</script>

<style scoped lang='sass'>
.wechat-login-container
  display: flex
  justify-content: center
  align-items: center
  min-height: 80vh
</style>
