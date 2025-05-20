<template>
  <View style='display: flex; width: 100%; margin: 4px 0;'>
    <View style='height: 36px; width: 32px; background-color: transparent; padding: 6px 0;' @click='onRecordClick'>
      <Image :src='audioInput ? keyboardAlt : volumeUp' mode='widthFix' style='width: 24px; height: 24px;' />
    </View>
    <View v-if='audioInput' style='width: 100%; height: 36px;'>
      <AudioRecorder v-model:message='_prompt' v-model:error='error' />
    </View>
    <Textarea
      v-else
      type='textarea'
      :value='_prompt'
      :placeholder='placeholder'
      :style='{width: "calc(100% - 16px)", fontSize: "14px", height: inputHeight + "px", border: "1px solid gray", borderRadius: "8px", padding: "8px"}'
      class='section-margin'
      @input='handleInput'
      autoHeight={false}
      @linechange='handleLineChange'
      :show-confirm-bar='false'
      :cursor-spacing='16'
    />
    <View style='height: 36px; padding: 6px 0; margin-left: 4px;'>
      <slot name='actions' />
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Image, Textarea } from '@tarojs/components'
import { onMounted, ref, toRef, watch } from 'vue'

import AudioRecorder from '../recorder/AudioRecorder.vue'

import { keyboardAlt, volumeUp } from 'src/assets'

interface Props {
  placeholder: string
}
const props = defineProps<Props>()
const placeholder = toRef(props, 'placeholder')

const prompt = defineModel<string>('prompt')
const error = defineModel<string>('error')
const audioInput = defineModel<boolean>('audioInput')

const _prompt = ref('')

watch(_prompt, () => {
  prompt.value = _prompt.value
})

watch(prompt, () => {
  _prompt.value = prompt.value || ''
})

const inputHeight = defineModel<number>('height')

const handleInput = (e: { detail: { value: string } }) => {
  _prompt.value = e.detail.value
}

const handleLineChange = (e: { detail: { lineCount: any } }) => {
  let lineCount = e.detail.lineCount
  if (!_prompt.value || _prompt.value.length <= 10) lineCount = 1
  const lineHeight = 18
  const maxLines = 4
  inputHeight.value = Math.min(maxLines, lineCount) * lineHeight
}

const onRecordClick = () => {
  if (!audioInput.value) { // Will switch to audio input
    _prompt.value = ''
    inputHeight.value = 18
  } else {
    const __prompt = _prompt.value
    _prompt.value = ''
    setTimeout(() => {
      _prompt.value = __prompt
    }, 100)
  }
  audioInput.value = !audioInput.value
}

onMounted(() => {
  setTimeout(() => {
    _prompt.value = prompt.value || ''
  }, 100)
})

</script>
