<template>
  <q-card
    :style='{
      position: "fixed",
      right: 0,
      bottom: 0,
      background: backgroundColor || "white",
      zIndex: 1000,
      maxWidth: `${maxWidth}`,
      width: `${width}px`,
      borderTopLeftRadius: (borderRadius || 24) + "px",
      borderTopRightRadius: (borderRadius || 24) + "px",
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0,
      marginRight: "16px"
    }'
  >
    <q-card-section v-if='title?.length' class='text-grey-9 cursor-pointer' @click='collapsed = !collapsed'>
      <div class='text-center' :style='{height: `${titleHeight}px`, fontSize: `${titleFontSize}px`}'>
        {{ title }}
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section v-if='!collapsed' class='q-pa-none'>
      <slot />
    </q-card-section>
  </q-card>
</template>

<script setup lang='ts'>
import { toRef, withDefaults, defineProps, ref } from 'vue'

interface Props {
  title?: string
  borderRadius?: number
  backgroundColor?: string
  width?: number
  maxWidth?: string
  titleHeight?: number
  titleFontSize?: number
}
const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  borderRadius: 16,
  backgroundColor: 'transparent',
  width: 300,
  maxWidth: '20%',
  titleHeight: 24,
  titleFontSize: 16
})
const title = toRef(props, 'title')
const maxWidth = toRef(props, 'maxWidth')
const width = toRef(props, 'width')
const borderRadius = toRef(props, 'borderRadius')
const backgroundColor = toRef(props, 'backgroundColor')
const titleHeight = toRef(props, 'titleHeight')
const titleFontSize = toRef(props, 'titleFontSize')

const collapsed = ref(true)

</script>
