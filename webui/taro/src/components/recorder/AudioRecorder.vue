<template>
  <View style='width: 100%;'>
    <Button size='mini' style='width: 100%; height: 24px; font-size: 14px; line-height: 24px;' @longpress='onLongPress' @touchend='onTouchEnd' @touchstart='onTouchStart' @touchmove='onTouchMove'>
      {{ recording ? '松开取消' : '长按说话' }}
    </Button>
  </View>
  <AtModal :is-opened='recording || converting'>
    <AtModalHeader>正在说话...</AtModalHeader>
    <AtModalContent>
      <View style='display: flex;  height: 80px; justify-content: center; align-items: center;'>
        <View v-for='(wave, index) in waves' :key='index' :style='{borderRight: "2px solid lightgray", height: wave.toString() + "px", width: "1px", marginRight: "1px"}' />
      </View>
    </AtModalContent>
    <AtModalAction>
      <View style='font-size: 12px; padding: 4px 0; text-align: center;  width: 100%;'>上滑发送，松开取消</View>
    </AtModalAction>
  </AtModal>
</template>

<script setup lang='ts'>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Button, View } from '@tarojs/components'
import { AtModal, AtModalHeader, AtModalContent, AtModalAction } from 'taro-ui-vue3'
import Taro from '@tarojs/taro'
import { entityBridge } from 'src/bridge'

const recording = ref(false)
const converting = ref(false)

const waves = ref([] as number[])
const waveCount = ref(40)
const waveTicker = ref(-1)
const startY = ref(0)
const endY = ref(0)

const recorderManager = Taro.getRecorderManager()

const audioPath = ref('')

const message = defineModel('message')
const error = defineModel('error')

const updateWave = () => {
  for (let i = 0; i < waveCount.value; i++) {
    waves.value[i] = Math.ceil(Math.random() * 50)
  }
}

const onLongPress = () => {
  recording.value = true
  waveTicker.value = window.setInterval(updateWave, 100)

  startRecord()
}

const convertAudio = (audioB64: string) => {
  entityBridge.ESpeech.speech2Text(audioB64).then((text) => {
    converting.value = false
    if (!text || !text.length) message.value = '您似乎遇到了一个网络错误，或者您的音频不包含有效文字，请重新录制试试！'
    else message.value = text
  }).catch((e) => {
    converting.value = false
    error.value = '您似乎遇到了一个网络错误，或者您的音频不包含有效文字，请重新录制试试！'
    console.log(`Failed convert audio: ${JSON.stringify(e)}`)
  })
}

const handleRecord = () => {
  converting.value = true

  const fs = Taro.getFileSystemManager()
  fs.readFile({
    filePath: audioPath.value,
    encoding: 'base64',
    success: (res) => {
      const audioB64 = res.data as string
      convertAudio(audioB64)
    },
    fail: (e) => {
      converting.value = false
      error.value = '您似乎遇到了一个存储错误，请重新录制试试！'
      console.log(`Failed read: ${JSON.stringify(e)}`)
    }
  })
}

const onTouchEnd = () => {
  recording.value = false
  stopRecord()
}

const onTouchStart = (e: { touches: { clientY: number }[] }) => {
  startY.value = e.touches[0].clientY
}

const onTouchMove = (e: { touches: { clientY: number }[] }) => {
  endY.value = e.touches[0].clientY
}

const startRecord = () => {
  recorderManager.start({
    duration: 60000,
    sampleRate: 44100,
    numberOfChannels: 1,
    encodeBitRate: 192000,
    format: 'mp3',
    frameSize: 50
  })
}

const stopRecord = () => {
  recorderManager.stop()
}

onMounted(() => {
  for (let i = 0; i < waveCount.value; i++) {
    waves.value.push(Math.ceil(Math.random() * 50))
  }

  recorderManager.onStop((res) => {
    recording.value = false
    audioPath.value = res.tempFilePath
    if (startY.value - endY.value > 50) {
      handleRecord()
    }
  })
  recorderManager.onError((e) => {
    recording.value = false
    error.value = '您似乎遇到了一个录制错误，请重新录制试试！'
    console.log(`Failed record: ${JSON.stringify(e)}`)
  })
})

onBeforeUnmount(() => {
  if (waveTicker.value >= 0) window.clearInterval(waveTicker.value)
})

</script>
