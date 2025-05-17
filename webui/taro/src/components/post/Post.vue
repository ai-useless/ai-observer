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
      <View v-for='([_prompt, _images], index) in images' :key='index' :style='{borderBottom: "1px solid lightgray", padding: "8px 0", display: "flex", width: "100%"}'>
        <View v-for='(image, index) in _images' :key='index' style='width: 33.3%;'>
          <Image :src='image' mode='widthFix' style='width: 100%;' />
        </View>
        <Text style='margin-top: 4px; font-size: 12px; color: gray;'>{{ _prompt }}</Text>
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
        placeholder='写下你现在的心情，例如：忐忑又充满希望'
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
import { dbBridge, entityBridge } from 'src/bridge'

import AudioRecorder from '../recorder/AudioRecorder.vue'

import { personAvatar, volumeUp, send, keyboardAlt } from 'src/assets'
import Taro from '@tarojs/taro'
import { model } from 'src/localstores'

const prompt = ref('忐忑又充满希望')

const inputAudio = ref(false)
const audioError = ref('')

const memeHeight = ref(0)
const scrollTop = ref(999999)

interface Image {
  prompt: string
  images: string[]
}
const images = ref(new Map<string, string[]>())
const imageCount = computed(() => images.value.size)

watch(imageCount, async () => {
  await nextTick()
  scrollTop.value += 1
})

const generate = (_prompt: string) => {
  entityBridge.EImage.generate(_prompt, '唯美而意境悠远', false, '', (_image: string) => {
    const _images = images.value.get(_prompt) || []
    _images.push(_image)
    images.value.set(_prompt, _images)
    Taro.hideLoading()
  })
}

const refine = (_prompt: string) => {
  Taro.showLoading({
    title: '正在创作...'
  })
  entityBridge.EChat.refine(_prompt, dbBridge._Model.topicModelId()).then((__prompt) => {
    if (!__prompt) {
      Taro.hideLoading()
      return
    }
    for (let i = 0; i < 9; i++) {
      generate(__prompt)
    }
  }).catch((e) => {
    Taro.hideLoading()
    console.log(`Failed refine: ${e}`)
  })
}

watch(prompt, () => {
  if (!inputAudio.value || !prompt.value || !prompt.value.length) return

  refine(prompt.value)
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
  refine(prompt.value)
}

onMounted(async () => {
  if (Taro.getWindowInfo()) {
    memeHeight.value = Taro.getWindowInfo().windowHeight - 32
  }
  model.Model.getModels()
})

</script>
