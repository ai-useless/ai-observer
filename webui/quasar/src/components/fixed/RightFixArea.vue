<template>
  <div
    :style='{
      position: "fixed",
      right: 0,
      top: 0,
      background: backgroundColor || "white",
      zIndex: 1000,
      maxWidth: "100%",
      width: `${maxWidth}px`,
      borderRadius: (borderRadius || 24) + "px",
      paddingRight: "4px",
      marginTop: `${marginTop}px`
    }'
  >
    <slot />
  </div>
</template>

<script setup lang='ts'>
import { defineProps, toRef } from 'vue'

interface Props {
  borderRadius?: number
  backgroundColor?: string
  maxWidth?: number
  marginTop?: number
}
const props = defineProps<Props>()
const borderRadius = toRef(props, 'borderRadius')
const backgroundColor = toRef(props, 'backgroundColor')
const maxWidth = toRef(props, 'maxWidth')
const marginTop = toRef(props, 'marginTop')

</script>

<style scoped lang='sass'>
</style>
