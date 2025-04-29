<template>
  <View style='width: 100%; border-radius: 8px; border: 1px solid lightblue; display: flex; justify-content: space-between;'>
    <View style='display: flex;'>
      <Image :src='_avatar || personCircle' style='width: 56px; height: 56px; margin: 16px; border-radius: 50%;' />
      <View style='margin-top: 16px;'>
        <View style='display: flex; align-items: center;'>
          <View v-if='username' style='font-weight: 600; color: gray;'>{{ username }}</View>
          <Input v-else type='nickname' placeholder='点击获取微信昵称' :value='wechatName' @input='onNicknameInput' style='height: 26px;' />
          <Button v-if='!_avatar' open-type='chooseAvatar' @chooseAvatar='onChooseAvatar' size='mini' plain style='font-size: 12px; color: gray; margin-left: 8px;' class='plain-btn'>获取头像</Button>
        </View>
        <View v-if='!username || !_avatar' style='font-size: 12px; color: blue;'>获取到头像和昵称后将自动登录</View>
        <View v-else style='font-size: 12px; color: blue; margin-top: 4px;' @click='onLoginClick'>{{ username ? '立即定制自己的AGI' : '登陆后可以定制AGI' }}</View>
      </View>
    </View>
    <View v-if='username && avatarUrl' style='display: flex; height: 32px; margin: 16px; flex-direction: end; align-items: center; border-top: 1px double lightblue; border-bottom: 1px double lightblue;'>
      <View style='font-size: 24px; font-weight: 600; color: green;'>{{ mySimulatorsCount }}</View>
      <View style='font-size: 12px; color: gray; margin-left: 8px; margin-top: 8px;'>我的角色</View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Image, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { computed, onMounted, ref, watch } from 'vue'
import { simulator, user } from 'src/localstores'

import { personCircle } from 'src/assets'

const username = computed(() => user.User.username())
const avatarUrl = computed(() => user.User.avatarUrl())
const avatar = computed(() => user.User.avatar())
const mySimulatorsCount = computed(() => simulator.Simulator.mySimulatorsCount())

const wechatName = ref('')
const wechatAvatar = ref('')
const wechatAvatarType = ref('')
const wechatDisplayAvatar = computed(() => `data:image/${wechatAvatarType.value};base64,${wechatAvatar.value}`)

const _avatar = computed(() => {
  if (avatarUrl.value) return avatarUrl.value
  return wechatAvatar.value.length ? wechatDisplayAvatar.value : undefined
})

const logining = ref(false)

watch(logining, () => {
  if (logining.value) {
    Taro.showLoading({
      title: '登录中...'
    })
   } else Taro.hideLoading()
})

const onLoginClick = () => {
  logining.value = true

  Taro.login().then((code) => {
    simulator.Simulator.countSimulators(code.code)
  }).catch(() => {
    Taro.showToast({
      title: '认证失败！',
      icon: 'error',
      duration: 1000
    })
  })

  Taro.getUserProfile({
    desc: '用于完善用户信息',
    success: (res) => {
      logining.value = false
      user.User.setAvatar(res.userInfo.avatarUrl)
      user.User.setUsername(res.userInfo.nickName)
    },
    fail: () => {
      logining.value = false
      Taro.showToast({
        title: '更新用户信息失败！',
        icon: 'error',
        duration: 1000
      })
    }
  })
}

const imageExtension = async (imagePath: string) => {
  if (imagePath.endsWith('.svg')) return 'svg+xml'
  return new Promise((resolve, reject) => {
    Taro.getImageInfo({
      src: imagePath,
      success: (res) => {
        resolve(res.type)
      },
      fail: (e) => {
        reject(e)
      }
    })
  })
}

const readAsBase64 = async (filePath: string) => {
  const fs = Taro.getFileSystemManager()
  const b64 = await new Promise((resolve, reject) => {
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (r) => resolve(r.data),
      fail: (e) => reject(e)
    })
  })
  return b64
}

const cookUser = () => {
  if (!username || !avatar) return
  Taro.login().then((code) => {
    user.User.cookUser(code.code)
  }).catch((e) => {
    Taro.showToast({
      title: '登录失败！',
      icon: 'error',
      duration: 1000
    })
  })
}

const onChooseAvatar = async (e: { detail: { avatarUrl: any } }) => {
  wechatAvatar.value = await readAsBase64(e.detail.avatarUrl) as string
  wechatAvatarType.value = await imageExtension(e.detail.avatarUrl) as string
  user.User.setAvatar(wechatAvatar.value)
  cookUser()
}

const onNicknameInput = (e: { detail: { value: string } }) => {
  wechatName.value = e.detail.value
  user.User.setUsername(wechatName.value)
  cookUser()
}

onMounted(() => {
  Taro.login().then((code) => {
    user.User.getUser(code.code)
  }).catch(() => {
    Taro.showToast({
      title: '获取用户信息失败！',
      icon: 'error',
      duration: 1000
    })
  })
})

</script>

<style lang='sass'>
.plain-btn
  border: none !important
  background-color: transparent
  box-shadow: none !important
  padding: 0 !important

.plain-btn::after
  border: none !important
  content: none !important
</style>
