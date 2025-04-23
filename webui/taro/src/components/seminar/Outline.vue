<template>
  <View style='max-width: 280px'>
    <View style='margin-top: 16px;'>
      <View v-for='title in titles' :key='title' :class='["cursor-pointer title", title === activeTopic ? "text-grey-9 text-bold" : "text-grey-7 normal"]' style='margin-left: 24px; margin-top: 8px;'>
        <View v-html='title' style='font-size: 12px;' />
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { computed, toRef } from 'vue'
import { View } from '@tarojs/components'

interface Props {
  json: Record<string, unknown>
  activeTopic: string
}
// eslint-disable-next-line no-undef
const props = defineProps<Props>()
const json = toRef(props, 'json')
const activeTopic = toRef(props, 'activeTopic')
const titles = computed(() => json.value.titles as string[])

</script>

<style scope lang='sass'>
.title
  p,
  div
    margin-bottom: 8px !important

.normal
  p,
  div
    font-weight: 400 !important
</style>
