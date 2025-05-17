<template>
  <View>
    <scroll-view
      scrollY={true}
      :scroll-with-animation='true'
      :style='{ height: memeHeight + "px" }'
      :scroll-top='scrollTop'
      showScrollbar={false}
      enhanced={true}
      showsVerticalScrollIndicator={false}
    >
      <View v-for='(image, index) in images' :key='index' :style='{borderBottom: index < images.length - 1 ? "1px solid lightgray" : "", padding: "8px 0"}'>
        <Image :src='image.image' mode='widthFix' style='width: 100%;' />
        <Text style='margin-top: 4px; font-size: 12px; color: gray;'>{{ image.prompt }}</Text>
      </View>
    </scroll-view>
    <View style='display: flex; flex-direction: row; align-items: center; width: 100%; height: 24px;'>
      <View style='height: 24px; background-color: white;' @click='onRecordClick'>
        <Image :src='inputAudio ? keyboardAlt : volumeUp' mode='widthFix' style='width: 24px; height: 24px;' />
      </View>
      <View v-if='inputAudio' style='margin-left: 4px; width: 100%; height: 24px;'>
        <AudioRecorder v-model:message='prompt' v-model:error='audioError' />
      </View>
      <Input
        v-else
        :value='prompt'
        @input='onPromptInput'
        style='font-size: 14px; height: 20px; border: 1px solid gray; border-radius: 4px; padding: 0 8px; width: 100%; margin-left: 4px;'
        placeholder='描述你的梗图，例如：尴尬的天鹅走在乡间小路上，一边是友情，一边是爱情！'
      />
      <View v-if='!inputAudio' style='height: 24px; background-color: white; margin-left: 4px;' @click='onGenerateClick'>
        <Image :src='send' mode='widthFix' style='width: 24px; height: 24px;' />
      </View>
      <View style='display: flex; align-items: center; border: 1px solid gray; border-radius: 8px; height: 24px; background-color: rgba(160, 160, 160, 0.5); margin-left: 4px;'>
        <View style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onSelectSimulatorClick'>
          <Image :src='personAvatar' mode='widthFix' style='width: 24px; height: 24px;' />
        </View>
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Input, Image, Text } from '@tarojs/components'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { entityBridge } from 'src/bridge'

import AudioRecorder from '../recorder/AudioRecorder.vue'

import { personAvatar, volumeUp, send, keyboardAlt } from 'src/assets'
import Taro from '@tarojs/taro'

const prompt = ref('尴尬的天鹅走在乡间小路上，一边是友情，一边是爱情')

const inputAudio = ref(false)
const audioError = ref('')

const memeHeight = ref(0)
const scrollTop = ref(999999)

interface Image {
  prompt: string
  image: string
}
const images = ref([] as Image[])
const imageCount = computed(() => images.value.length)

watch(imageCount, async () => {
  await nextTick()
  scrollTop.value += 1
})

const generate = (_prompt: string) => {
  Taro.showLoading({
    title: '正在创作...'
  })
  entityBridge.EImage.generate(prompt.value, 'Meme风格，带有寓意', true, '', false, false, (_image: string) => {
    images.value.push({
      prompt: _prompt,
      image: _image
    })
    Taro.hideLoading()
  })
}

watch(prompt, () => {
  if (!inputAudio.value || !prompt.value || !prompt.value.length) return

  generate(prompt.value)
})

watch(audioError, () => {
  if (!inputAudio.value || !audioError.value || !audioError.value.length) return

  audioError.value = ''
})

const onSelectSimulatorClick = () => {

}

const onRecordClick = () => {
  inputAudio.value = !inputAudio.value
}

const onPromptInput = (e: { detail: { value: string } }) => {
  prompt.value = e.detail.value
}

const onGenerateClick = () => {
  generate(prompt.value)
}

onMounted(async () => {
  if (Taro.getWindowInfo()) {
    memeHeight.value = Taro.getWindowInfo().windowHeight - 32
  }
})

</script>
