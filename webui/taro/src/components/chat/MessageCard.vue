<template>
  <View :style='{display: "flex", padding: "4px 0", flexDirection: _message.send ? "row-reverse" : "row"}'>
    <View v-if='!_message.send'>
      <Image :src='_message.avatar' style='width: 48px; height: 48px; border-radius: 50%;' />
    </View>
    <View v-else style='margin-left: 8px;'>
      <Image :src='_message.avatar' style='width: 48px; height: 48px; border-radius: 50%;' />
    </View>
    <View style='margin-left: 8px;'>
      <View :style='{backgroundColor: _message.hint ? "rgba(160, 160, 160, 0.2)" : _message.send ? "#07c160" : "white", color: _message.hint ? "black" : _message.send ? "white" : "black", borderRadius: _message.send ? "16px 16px 0 16px" : "16px 16px 16px 0", padding: "8px", border: "1px solid rgba(200, 200, 200, 0.3)"}'>
        <rich-text :nodes='_message.message' />
      </View>
      <Text style='margin-top: 4px; font-size: 12px; color: gray;'>{{ _message.datetime }}</Text>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { toRef } from 'vue'
import { View, RichText, Image } from '@tarojs/components'

import { Message } from './Message'

interface Props {
  message: Message
}
const props = defineProps<Props>()
const _message = toRef(props, 'message')

</script>
