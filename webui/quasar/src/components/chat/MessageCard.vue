<template>
  <div :style='{display: "flex", padding: "4px 0", flexDirection: _message.send ? "row-reverse" : "row"}'>
    <div v-if='!_message.send'>
      <q-img :src='_message.avatar' style='width: 48px; height: 48px; border-radius: 50%;' />
    </div>
    <div v-else style='margin-left: 8px;'>
      <q-img :src='_message.avatar' style='width: 48px; height: 48px; border-radius: 50%;' />
    </div>
    <div style='margin-left: 16px;'>
      <div :style='{backgroundColor: _message.hint ? "rgba(160, 160, 160, 0.2)" : _message.send ? "#07c160" : "white", color: _message.hint ? "black" : _message.send ? "white" : "black", borderRadius: _message.send ? "16px 16px 0 16px" : "16px 16px 16px 0", padding: "8px", border: "1px solid rgba(200, 200, 200, 0.3)"}'>
        <div>{{ _message.message }}</div>
      </div>
      <div style='margin-top: 4px; font-size: 12px; color: gray;'>
        {{ _message.datetime }}
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { toRef } from 'vue'
import { Message } from './Message'

interface Props {
  message: Message
}

const props = defineProps<Props>()
const _message = toRef(props, 'message')

</script>
