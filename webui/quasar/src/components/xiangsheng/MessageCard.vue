<template>
  <div
    :stamp='message.datetime'
    :text='[message.message]'
    style='width: 100%;'
  >
    <div v-if='message.first' style='font-size: 16px; padding: 16px 0; font-weight: 600; text-align: center;' class='text-grey-9'>
      {{ message.topic }}
    </div>
    <div style='padding-bottom: 4px; line-height: 18px; padding-top: 4px; padding-bottom: 4px; display: flex; flex-wrap: wrap; justify-content: center; align-items: center;' class='text-grey-8'>
      <div>{{ message.participator.role === dbModel.Role.HOST ? '逗哏' : '捧哏' }}</div>
      <q-img :src='message.simulator.simulator_avatar_url' style='margin-left: 4px; height: 24px; width: 24px; border-radius: 50%;' />
      <div style='width: calc(100% - 24px - 16px - 32px); margin-left: 16px;'>
        <div style='font-size: 16px;'>
          {{ message.message }}
        </div>
      </div>
    </div>
    <div v-if='message.last && !message.typing' style='font-size: 20px; color: gray; padding: 16px 0; text-align: center;' class='text-grey-8'>
      谢谢观看！下一场表演更精彩！
    </div>
  </div>
</template>

<script setup lang='ts'>
import { toRef, defineProps } from 'vue'
import { Message } from './Message'
import { dbModel } from 'src/model'

interface Props {
  message: Message
}
const props = defineProps<Props>()
const message = toRef(props, 'message')

</script>
