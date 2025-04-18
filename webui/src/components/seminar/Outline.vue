<template>
  <div style='max-width: 280px'>
    <div style='margin-top: 16px;'>
      <div v-for='(title, index) in titles' :key='title' :class='["cursor-pointer", index === activeIndex ? "text-grey-9 text-bold" : "text-grey-7"]' style='margin-left: 24px; margin-top: 8px;'>
        <div v-html='title' />
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
