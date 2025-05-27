<template>
  <q-card class='q-mt-xl q-mb-xl border-radius-16px' style='width: 400px;'>
    <q-card-section class='text-center text-bold'>
      微信扫码登录
    </q-card-section>
    <q-separator />
    <q-card-section class='text-center'>
      <div class='q-mb-md relative'>
        <iframe
          :src='wechatLoginUrl'
          frameborder='0'
          allowfullscreen
          height='400px'
        />
      </div>
    </q-card-section>
    <q-card-section class='text-center'>
      <div class='q-mb-md relative'>
        登录表示您同意没谱儿AGI的<a href=''>用户手册</a>和<a href=''>隐私协议</a>！
      </div>
    </q-card-section>
    <q-separator />
    <q-card-actions class='q-pa-none' style='height: 48px'>
      <q-btn flat class='full-width text-grey-8 full-height' @click='onCancelLogin'>
        随便逛逛，以后再说
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script lang='ts' setup>
import { ref, onMounted, defineProps, toRef, defineEmits } from 'vue'

interface Props {
  fromLoginPage?: boolean
}
const props = defineProps<Props>()
const fromLoginPage = toRef(props, 'fromLoginPage')

const wechatLoginUrl = ref('')

const WECHAT_APPID = 'wxb15d0a9d035f78e1'
const REDIRECT_URI = encodeURIComponent('http://meipu-agi.cn/wechat/callback')
const SCOPE = 'snsapi_login'
const STATE = `wechat_login_${Date.now()}${fromLoginPage.value ? '_fromLogin' : ''}`

onMounted(() => {
  wechatLoginUrl.value = `https://open.weixin.qq.com/connect/qrconnect?
                          appid=${WECHAT_APPID}&
                          redirect_uri=${REDIRECT_URI}&
                          response_type=code&
                          scope=${SCOPE}&
                          state=${STATE}#wechat_redirect`.replace(/\s+/g, '')
})

const emit = defineEmits<{(ev: 'cancel'): void}>()

const onCancelLogin = () => {
  emit('cancel')
}

</script>

<style scoped lang='sass'>
.wechat-login-container
  display: flex
  justify-content: center
  align-items: center
  min-height: 80vh
</style>
