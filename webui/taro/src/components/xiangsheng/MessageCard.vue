<template>
  <View
    :stamp='message.datetime'
    :text='[message.message]'
    text-color='grey-9'
    bg-color='grey-2'
    style='width: 100%;'
  >
    <View v-if='message.first' style='font-size: 16px; padding: 16px 0; font-weight: 600; text-align: center;'>
      {{ message.topic }}
    </View>
    <View style='padding-bottom: 4px; line-height: 24px; margin-top: 8px; padding-top: 4px; padding-bottom: 8px; display: flex; flex-wrap: wrap; text-align: center;'>
      <View>{{ message.participator.role === dbModel.Role.HOST ? '逗哏' : '捧哏' }}</View>
      <Image :src='message.simulator.simulator_avatar_url' mode='scaleToFill' style='margin-left: 4px; height: 24px; width: 24px; border-radius: 50%;' />
      <rich-text :nodes='message.message' user-select style='font-size: 14px; margin-left: 4px;' />
    </View>
    <View v-if='message.last && !message.typing' style='font-size: 20px; color: gray; padding: 16px 0; text-align: center;'>
      谢谢观看！下一场表演更精彩！
    </View>
  </View>
</template>

<script setup lang='ts'>
import { toRef } from 'vue';
import { Message } from './Message'
import { dbModel } from 'src/model'
import { View, RichText, Image } from '@tarojs/components'

interface Props {
  message: Message
}
const props = defineProps<Props>()
const message = toRef(props, 'message')

</script>
