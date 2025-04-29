<template>
  <View style='width: 100%; border-radius: 8px; border: 1px solid lightblue; display: flex; justify-content: space-between;'>
    <View style='display: flex;'>
      <Image :src='avatar || personCircle' style='width: 48px; height: 48px; margin: 16px; border-radius: 50%;' />
      <View style='margin-top: 16px;'>
        <View style='font-weight: 600; color: gray;'>{{ username || '未登录用户' }}</View>
        <View style='font-size: 12px; color: blue;' @click='onLoginClick'>{{ username ? '马上定制自己的AGI' : '点击登录定制AGI' }}</View>
      </View>
    </View>
    <View v-if='username' style='display: flex; height: 48px; margin: 16px; flex-direction: end; align-items: center;'>
      <View style='font-size: 24px; font-weight: 600; color: green;'>{{ mySimulatorsCount }}</View>
      <View style='font-size: 12px; color: gray; margin-left: 8px; margin-top: 8px;'>我的角色</View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { computed, ref, watch } from 'vue'
import { simulator, user } from 'src/localstores'

import { personCircle } from 'src/assets'

const username = computed(() => user.User.username())
const avatar = computed(() => user.User.avatar())
const mySimulatorsCount = computed(() => simulator.Simulator.mySimulatorsCount())

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

</script>

<style lang='sass'>
</style>
