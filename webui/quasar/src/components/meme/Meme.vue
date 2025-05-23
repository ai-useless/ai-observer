<template>
  <q-page>
    <div style='width: 100%; height: 100vh;' class='flex justify-center items-center'>
      <div style='height: 100vh; width: min(100%, 960px);' class='bg-grey-2'>
        <q-scroll-area
          style='height: calc(100% - 80px); width: 100%;'
          ref='chatBox'
          :bar-style='{ width: "2px" }'
          :thumb-style='{ width: "2px" }'
          class='cursor-pointer'
        >
          <div>
            <q-resize-observer @resize='onChatBoxResize' />
            <div v-for='(image, index) in images' :key='index' :style='{borderBottom: index < images.length - 1 ? "1px solid lightgray" : "", padding: "0 0 16px 0"}'>
              <div style='width: 100%'>
                <q-img :src='image.image' style='width: 100%;' />
              </div>
              <div style='margin-top: 4px; font-size: 16px; padding: 16px;' class='text-black'>
                {{ image.prompt }}
              </div>
            </div>
            <div v-if='generating' class='flex justify-center items-center' style='height: 128px; width: 100%'>
              <div class='text-center'>
                <q-spinner-facebook class='text-red-4' size='64px' />
                <div>AGI正在创作，请稍候...</div>
              </div>
            </div>
          </div>
        </q-scroll-area>
        <div class='flex justify-center items-center'>
          <BottomFixInput
            v-model='prompt'
            placeholder='随便搞笑一下~'
            @enter='onPromptEnter'
            :disabled='generating'
            :loading='generating'
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang='ts'>
import { onMounted, ref, watch } from 'vue'
import { entityBridge } from 'src/bridge'
import { model } from 'src/localstores'
import { QScrollArea } from 'quasar'

import BottomFixInput from '../input/BottomFixInput.vue'

const prompt = ref('一只极度震惊的猫咪，漫画风格，表情夸张，带有“当你发现代码全错了”的文字，上下标题格式')

const audioInput = ref(false)
const audioError = ref('')
const generating = ref(false)

const chatBox = ref<QScrollArea>()

interface Image {
  prompt: string
  image: string
}
const images = ref([] as Image[])

const onChatBoxResize = (size: { height: number }) => {
  chatBox.value?.setScrollPosition('vertical', size.height, 300)
}

const generate = (_prompt: string) => {
  generating.value = true

  entityBridge.EImage.generate(prompt.value, 'Meme风格，带有寓意', true, '', false, '16:9', (_image: string) => {
    generating.value = false

    prompt.value = ''

    images.value.push({
      prompt: _prompt,
      image: _image
    })
  }, () => {
    generating.value = false
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

const onPromptEnter = (_topic: string) => {
  generate(_topic)
}

onMounted(() => {
  model.Model.getModels(() => {
    generate(prompt.value)
  })
})

</script>
