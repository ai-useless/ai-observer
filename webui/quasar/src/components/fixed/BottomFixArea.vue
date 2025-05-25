<template>
  <div
    :style='{
      position: "fixed",
      bottom: 0,
      background: backgroundColor || "white",
      zIndex: 1000,
      maxWidth: `${maxWidth}`,
      width: `${width}`,
      borderRadius: (borderRadius || 24) + "px",
      marginBottom: "16px"
    }'
  >
    <slot />
  </div>
</template>

<script setup lang='ts'>
import { defineProps, toRef, withDefaults } from 'vue'

interface Props {
  borderRadius?: number
  backgroundColor?: string
  maxWidth?: string
  width?: string
}
const props = withDefaults(defineProps<Props>(), {
  borderRadius: 16,
  backgroundColor: 'transparent',
  maxWidth: '600px',
  width: '100%'
})
const borderRadius = toRef(props, 'borderRadius')
const backgroundColor = toRef(props, 'backgroundColor')
const maxWidth = toRef(props, 'maxWidth')

</script>

<style scoped lang='sass'>
</style>
