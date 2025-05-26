<template>
  <div
    :style='{
      position: "fixed",
      bottom: 0,
      background: backgroundColor,
      zIndex: 1000,
      maxWidth: `${maxWidth}`,
      width: `${width}`,
      borderRadius: (borderRadius || 24) + "px",
      margin: "4px"
    }'
  >
    <slot />
  </div>
</template>

<script setup lang='ts'>
import { Platform } from 'quasar'
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
  width: '600px',
  maxWidth: Platform.is.mobile ? '100%' : '90%'
})
const borderRadius = toRef(props, 'borderRadius')
const backgroundColor = toRef(props, 'backgroundColor')
const maxWidth = toRef(props, 'maxWidth')

</script>

<style scoped lang='sass'>
</style>
