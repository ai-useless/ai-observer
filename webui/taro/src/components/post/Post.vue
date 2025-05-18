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
      <View v-for='([_prompt, _images], index) in images' :key='index' :style='{borderBottom: "1px solid lightgray", padding: "8px 0", width: "100%"}'>
        <View style='width: 100%;'>
          <View style='width: 100%; display: flex;'>
            <View v-if='_images.length' v-for='(image, index) in _images.slice(0, 3)' :key='index' style='width: 33.3%;'>
              <Image :src='image' mode='widthFix' style='width: 100%;' />
            </View>
          </View>
          <View style='width: 100%; display: flex;'>
            <View v-if='_images.length > 3' v-for='(image, index) in _images.slice(3, 6)' :key='index' style='width: 33.3%;'>
              <Image :src='image' mode='widthFix' style='width: 100%;' />
            </View>
          </View>
          <View style='width: 100%; display: flex;'>
            <View v-if='_images.length > 6' v-for='(image, index) in _images.slice(6)' :key='index' style='width: 33.3%;'>
              <Image :src='image' mode='widthFix' style='width: 100%;' />
            </View>
          </View>
        </View>
        <View style='margin-top: 4px; font-size: 12px; color: gray;'>{{ _prompt }}</View>
        <Button class='plain-btn' size='mini' plain style='margin-top: 4px;' open-type='share'>
          <Image :src='share' style='width: 16px; height: 16px;' />
        </Button>
      </View>
    </scroll-view>
    <View style='display: flex;'>
      <ComplexInput v-model:prompt='prompt' v-model:audio-input='audioInput' v-model:height='inputHeight' placeholder='随便问点儿啥'>
        <template #actions>
          <View style='height: 24px; width: 24px; padding: 3px 0; margin-left: 4px; margin-right: -4px;' @click='onGenerateClick'>
            <Image :src='send' style='width: 18px; height: 18px;' />
          </View>
        </template>
      </ComplexInput>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Image, Text, Button } from '@tarojs/components'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { dbBridge, entityBridge } from 'src/bridge'
import Taro from '@tarojs/taro'
import { model } from 'src/localstores'

import ComplexInput from '../input/ComplexInput.vue'

import { send, share } from 'src/assets'

const prompt = ref('忐忑又充满希望')

const audioInput = ref(false)
const audioError = ref('')

const inputHeight = ref(0)
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
  entityBridge.EImage.generate(_prompt, '唯美而意境悠远', false, '', true, true, (_image: string) => {
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
  if (!audioInput.value || !prompt.value || !prompt.value.length) return

  refine(prompt.value)
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

  audioError.value = ''
})

watch(inputHeight, () => {
  if (Taro.getWindowInfo()) {
    memeHeight.value = Taro.getWindowInfo().windowHeight - 32 - inputHeight.value
  }
})

const onGenerateClick = () => {
  refine(prompt.value)
}

onMounted(async () => {
  Taro.setNavigationBarTitle({
    title: 'AGI超有才'
  })

  if (Taro.getWindowInfo()) {
    memeHeight.value = Taro.getWindowInfo().windowHeight - 32
  }
  model.Model.getModels()
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
