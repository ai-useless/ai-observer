<template>
  <View>
    <View style='border-bottom: 1px solid gray; padding-bottom: 4px;'>声音</View>
    <View style='display: flex; width: 100%; justify-content: space-between; align-items: center; margin-top: 8px; border-bottom: 1px solid lightblue; padding-bottom: 4px;'>
      <View style='font-size: 14px; color: gray;'>定制AGI声音</View>
      <View style='display: flex;'>
        <View @click='onAudioClick'>
          <Image :src='mic' style='width: 18px; height: 18px;' />
        </View>
      </View>
    </View>
    <View style='display: flex; width: 100%; justify-content: space-between; align-items: center; margin-top: 8px; border-bottom: 1px solid lightblue; padding-bottom: 4px;'>
      <View style='font-size: 14px; color: gray;'>我的AGI声音</View>
      <Image :src='chevronRight' style='width: 18px; height: 18px;' />
    </View>
    <View style='display: flex; width: 100%; justify-content: space-between; align-items: center; margin-top: 8px; border-bottom: 1px solid lightblue; padding-bottom: 4px;'>
      <View style='font-size: 14px; color: gray;'>没谱儿的AGI声音</View>
      <Image :src='chevronRight' style='width: 18px; height: 18px;' />
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { user } from 'src/localstores'
import { computed } from 'vue'
import axios from 'taro-axios'
import { constants } from 'src/constant'

import { chevronRight, mic } from 'src/assets'

const username = computed(() => user.User.username())
const avatar = computed(() => user.User.avatar())

const onAudioClick = () => {
  // TODO:
}

const uploadAudioB64 = (audioB64: string) => {
  Taro.login().then((code) => {
    axios.post(constants.COOK_AUDIO_API, {
      code: code.code,
      username: username.value,
      avatar: avatar.value,
      audio_b64: audioB64
    }).then((audioUrl) => {
      console.log(audioUrl)
    }).catch(() => {
      Taro.showToast({
        title: '上传失败！',
        icon: 'error',
        duration: 1000
      })
    })
  }).catch(() => {
    Taro.showToast({
      title: '认证失败！',
      icon: 'error',
      duration: 1000
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

const onUploadAudioClick = async () => {
  if (!username.value) {
    Taro.showToast({
      title: '请先登录哦！',
      icon: 'error',
      duration: 1000
    })
    return
  }

  const extensions = ['mp3', 'wav']
  Taro.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['mp3', 'wav']
  }).then((res) => {
    if (!res.tempFiles[0].path.endsWith(extensions[0]) && !res.tempFiles[0].path.endsWith(extensions[1])) {
      Taro.showToast({
        title: '无效音频文件！',
        icon: 'error',
        duration: 1000
      })
      return
    }
    readAsBase64(res.tempFiles[0].path).then((audioB64: string) => {
      if (audioB64.length > 8 * 1024 * 1024) {
        Taro.showToast({
          title: '文件太大了！',
          icon: 'error',
          duration: 1000
        })
        return
      }
      void uploadAudioB64(audioB64)
    }).catch((e) => {
      Taro.showToast({
        title: `读取文件失败：${JSON.stringify(e)}`,
        icon: 'error',
        duration: 1000
      })
    })
  }).catch((e) => {
    console.log(`选择文件失败: ${JSON.stringify(e)}`)
  })
}

</script>

<style lang='sass'>
</style>
