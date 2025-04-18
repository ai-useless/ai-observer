<template>
  <div style='max-width: 280px'>
    <div style='margin-top: 16px;'>
      <div v-for='(title, index) in titles' :key='title' :class='["cursor-pointer title", index === activeIndex ? "text-grey-9 text-bold" : "text-grey-7 normal"]' style='margin-left: 24px; margin-top: 8px;'>
        <div v-html='title' style='font-size: 12px;' />
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { computed, toRef } from 'vue'

interface Props {
  json: Record<string, unknown>
  activeIndex: number
}
// eslint-disable-next-line no-undef
const props = defineProps<Props>()
const json = toRef(props, 'json')
const activeIndex = toRef(props, 'activeIndex')
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
