<template>
  <View style='width: 100%;'>
    <Button size='mini' style='width: 100%; height: 24px; font-size: 14px; line-height: 24px;' @longpress='onLongPress' @touchend='onTouchEnd' @touchstart='onTouchStart' @touchmove='onTouchMove'>
      {{ recording ? '松开取消' : '长按说话' }}
    </Button>
  </View>
  <AtModal :is-opened='recording'>
    <AtModalHeader>正在说话...</AtModalHeader>
    <AtModalContent>
      <View v-if='recording' style='display: flex;  height: 80px; justify-content: center; align-items: center;'>
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
    console.log(text)
  }).catch((e) => {
    console.log(`Failed convert audio: ${e}`)
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
      console.log(`Failed read: ${e}`)
    }
  })
}

const onTouchEnd = () => {
  recording.value = false
  stopRecord()
  if (endY.value - startY.value > 50) {
    handleRecord()
  }
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
    audioPath.value = res.tempFilePath
  })
  recorderManager.onError((e) => {
    console.log(`Failed record: ${JSON.stringify(e)}`)
  })
})

onBeforeUnmount(() => {
  if (waveTicker.value >= 0) window.clearInterval(waveTicker.value)
})

</script>
