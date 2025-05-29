<template>
  <View>
    <View style='display: flex; line-height: 32px; padding: 16px 0 0 0;'>
      <View class='border-gradient-bg-white border-round'>
        <Image :src='modelLogo(_message.modelId)' mode='widthFix' style='height: 32px; width: 32px; border-radius: 50%;' />
      </View>
      <View style='font-weight: 400; font-size: 18px; line-height: 1.2em;' class='text-grey-6 q-ml-sm flex items-center'>
        {{ modelName(_message.modelId) }}
      </View>
    </View>
    <View style='font-size: 18px; font-weight: 600; text-align: center; padding: 16px 0; line-height: 24px;'>
      {{ message.title }}
    </View>
    <Image v-if='message.image' mode='widthFix' :src='message.image' style='width: 100%; margin-bottom: 4px;' />
    <View style='font-size: 16px; font-weight: 400; text-align: left; padding: 8px 0 16px 0; line-height: 24px;'>
      {{ message.message }}
    </View>
  </View>
</template>

<script setup lang='ts'>
import { computed, toRef } from 'vue'
import { Message } from './Message'
import { model } from 'src/localstores'
import { View, Image } from '@tarojs/components'

interface Props {
  message: Message
}
const props = defineProps<Props>()
const _message = toRef(props, 'message')

const models = computed(() => model.Model.models())

const modelLogo = (modelId: number) => {
  const model = models.value.find((el) => el.id === modelId)
  return model ? model.model_logo_url : ''
}

const modelName = (modelId: number) => {
  const model = models.value.find((el) => el.id === modelId)
  return model ? model.name : ''
}

</script>
