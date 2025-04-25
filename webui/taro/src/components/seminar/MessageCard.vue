<template>
  <View
    v-if='!message.subTopicTitle'
    :name='message.simulator.name + " | " + message.participator.role + " | " + message.model.name'
    :avatar='message.simulator.avatar'
    :stamp='message.datetime'
    :text='[message.message]'
    text-color='grey-9'
    bg-color='grey-2'
  >
    <View style='padding-bottom: 4px; line-height: 24px; border-bottom: 1px solid gray; border-top: 1px solid gray; margin-top: 8px; padding-top: 4px;'>
      <View style='display: flex; height: 24px;'>
        <View>{{ message.participator.role === dbModel.Role.HOST ? '主持人' : '嘉宾' }}</View>
        <Image :src='message.simulator.avatar' mode='widthFix' style='margin-left: 4px; width: 24px; border-radius: 50%;' />
        <View style='color: blue; font-weight: 600; margin-left: 8px;'>{{ message.simulator.name }}</View>
        <Image :src='message.model.authorLogo' mode='widthFix' style='margin-left: 8px; width: 24px; height: 24px;' />
        <Image :src='message.model.vendorLogo' mode='widthFix' style='margin-left: 8px; width: 24px; height: 24px;' />
        <Image :src='message.model.modelLogo' mode='widthFix' style='margin-left: 8px; width: 24px; height: 24px;' />
      </View>
      <View style='font-size: 12px; color: gray;'>{{ message.simulator.personality }}</View>
      <View style='font-size: 12px; color: gray;'>
        {{ message.model.name }}
      </View>
    </View>
    <rich-text :nodes='message.message' user-select style='font-size: 14px; margin-top: 16px;' />
  </View>
  <View v-else style='font-size: 24px; margin: 24px 0; font-weight: 600;'>
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
