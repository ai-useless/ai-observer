<template>
  <View>
    <View style='border-bottom: 1px solid gray; padding-bottom: 4px;'>声音</View>
    <View style='display: flex; width: 100%; justify-content: space-between; align-items: center; margin-top: 8px; border-bottom: 1px solid lightblue; padding-bottom: 4px;'>
      <View style='font-size: 14px; color: gray;'>定制AGI声音</View>
      <View style='display: flex;'>
        <View @click='onUploadAudioClick'>
          <Image :src='folder' style='width: 18px; height: 18px;' />
        </View>
        <View @click='onRecordAudioClick'>
          <Image :src='record' style='width: 18px; height: 18px; margin-left: 4px;' @click='onRecordAudioClick' />
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

import { chevronRight, folder, record } from 'src/assets'

const onRecordAudioClick = () => {
  // TODO:
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
  const extensions = ['mp3', 'wav']
  Taro.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['mp3', 'wav']
  }).then((res) => {
    if (!res.tempFiles[0].path.endsWith(extensions[0]) && !res.tempFiles[0].path.endsWith(extensions[1])) return
    readAsBase64(res.tempFiles[0].path).then((audioB64) => {
      console.log(audioB64)
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
