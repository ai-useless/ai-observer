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

onMounted(async () => {
  // For we app we cannot request network directly
  const payload = await seminarWorker.SeminarRunner.handleChatRequest({
    intent: seminarWorker.Intent.OUTLINE,
  } as seminarWorker.ChatRequestPayload)
  console.log(111, payload)
})

</script>

<style lang='sass'>
.title
  color: red
</style>
