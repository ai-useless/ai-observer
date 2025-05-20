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
        <View style='width: 100%' @click='onPreviewImageClick(image.image, [image.image])'>
          <Image :src='image.image' mode='widthFix' style='width: 100%;' />
        </View>
        <Text style='margin-top: 4px; font-size: 12px; color: gray;'>{{ image.prompt }}</Text>
      </View>
    </scroll-view>
    <View style='display: flex;'>
      <ComplexInput v-model:prompt='prompt' v-model:audio-input='audioInput' v-model:height='inputHeight' placeholder='随便搞笑一下~'>
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
import { View, Image, Text } from '@tarojs/components'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { entityBridge } from 'src/bridge'

import ComplexInput from '../input/ComplexInput.vue'

import { send } from 'src/assets'
import Taro from '@tarojs/taro'

const prompt = ref('一只极度震惊的猫咪，漫画风格，表情夸张，带有“当你发现代码全错了”的文字，上下标题格式')

const audioInput = ref(false)
const audioError = ref('')

const inputHeight = ref(0)
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
  entityBridge.EImage.generate(prompt.value, 'Meme风格，带有寓意', true, '', false, '16:9', (_image: string) => {
    images.value.push({
      prompt: _prompt,
      image: _image
    })
    Taro.hideLoading()
  })
}

watch(prompt, () => {
  if (!audioInput.value || !prompt.value || !prompt.value.length) return

  generate(prompt.value)
  prompt.value = ''
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

  audioError.value = ''
})

const onGenerateClick = () => {
  generate(prompt.value)
}

watch(inputHeight, () => {
  if (Taro.getWindowInfo()) {
    memeHeight.value = Taro.getWindowInfo().windowHeight - 32 - inputHeight.value
  }
})

onMounted(async () => {
  Taro.setNavigationBarTitle({
    title: 'AGI超有梗'
  })

  if (Taro.getWindowInfo()) {
    memeHeight.value = Taro.getWindowInfo().windowHeight - 32
  }
})

const onPreviewImageClick = (image: string, _images: string[]) => {
  Taro.previewImage({
    current: image,
    urls: _images,
    enablesavephoto: true,
    enableShowPhotoDownload: true,
    showmenu: true
  })
}

</script>
