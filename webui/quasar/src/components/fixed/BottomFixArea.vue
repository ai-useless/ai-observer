<template>
  <div
    :style='{
      position: "fixed",
      bottom: 0,
      background: backgroundColor || "white",
      zIndex: 1000,
      maxWidth: "100%",
      width: `${maxWidth}px`,
      borderRadius: (borderRadius || 24) + "px",
      marginBottom: "16px"
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
}
const props = defineProps<Props>()
const borderRadius = toRef(props, 'borderRadius')
const backgroundColor = toRef(props, 'backgroundColor')
const maxWidth = toRef(props, 'maxWidth')

</script>

<style scoped lang='sass'>
</style>
