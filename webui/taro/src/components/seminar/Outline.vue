<template>
  <View style='max-width: 280px'>
    <View>
      <View v-for='(title, index) in titles' :key='index' :class='["title", title === activeTopic ? "" : "normal"]' :style='{marginLeft: "24px", marginTop: index > 0 ? "8px" : "0"}'>
        <rich-text style='font-size: 12px;' :nodes='title' />
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { computed, toRef } from 'vue'
import { View, RichText } from '@tarojs/components'

interface Props {
  json: Record<string, unknown>
  activeTopic: string
}
// eslint-disable-next-line no-undef
const props = defineProps<Props>()
const json = toRef(props, 'json')
const activeTopic = toRef(props, 'activeTopic')
const titles = computed(() => json.value ? json.value.titles as string[] : [])

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
