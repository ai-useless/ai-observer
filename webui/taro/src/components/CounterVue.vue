<template>
  <view>
    <text class='title'>{{ counter.count }}</text>
    <view @tap='onAdd'>ADD</view>
  </view>
</template>

<script setup lang='ts'>
import { onMounted } from 'vue'
import { useCounterStore } from '../stores/counter'
import { seminarWorker } from '../worker'

const counter = useCounterStore()

const onAdd = () => {
  counter.count++

  // with autocompletion ✨
  // counter.$patch({count: counter.count + 1})

  // or using an action instead
  // counter.increment()
}

onMounted(() => {
  seminarWorker.SeminarWorker.on(seminarWorker.SeminarEventType.CHAT_REQUEST, (payload) => {
    console.log(111, payload)
  })
  seminarWorker.SeminarWorker.send(seminarWorker.SeminarEventType.CHAT_REQUEST, {
    intent: seminarWorker.Intent.OUTLINE
  } as seminarWorker.ChatRequestPayload)
})

</script>

<style lang='sass'>
.title
  color: red
</style>
