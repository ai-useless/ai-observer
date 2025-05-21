<template>
  <View
    v-if='!message.subTopicTitle'
    :stamp='message.datetime'
    :text='[message.message]'
    style='width: 100%;'
  >
    <View style='padding-bottom: 4px; line-height: 24px; border-bottom: 1px solid gray; border-top: 1px solid gray; margin-top: 8px; padding-top: 4px; margin-bottom: 8px; padding-bottom: 8px;'>
      <View style='display: flex; height: 24px; justify-content: center; align-items: center;'>
        <View style='color: white;'>{{ message.participator.role === dbModel.Role.HOST ? '主持人' : '嘉宾' }}</View>
        <Image :src='message.simulator.simulator_avatar_url' mode='widthFix' style='margin-left: 4px; width: 24px; border-radius: 50%;' />
        <View style='color: white; font-weight: 600; margin-left: 8px;'>{{ message.simulator.simulator }}</View>
        <Image :src='message.model.author_logo_url' mode='widthFix' style='margin-left: 8px; width: 24px; height: 24px;' />
        <Image :src='message.model.vendor_logo_url' mode='widthFix' style='margin-left: 8px; width: 24px; height: 24px;' />
        <Image :src='message.model.model_logo_url' mode='widthFix' style='margin-left: 8px; width: 24px; height: 24px;' />
      </View>
      <View style='font-size: 12px; color: gray; min-height: 16px; line-height: 1.2; margin-top: 8px;'>{{ message.simulator.origin_personality }}</View>
      <View style='font-size: 12px; color: gray; height: 16px;'>
        {{ message.model.name }}
      </View>
    </View>
    <rich-text :nodes='message.message' user-select style='font-size: 14px; margin-top: 16px; color: white;' />
  </View>
  <View v-else style='font-size: 24px; margin: 24px 0; font-weight: 600; color: white;'>
    {{ message.subTopic }}
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
