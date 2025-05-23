<template>
  <BottomFixArea>
    <q-input
      v-model='message'
      :placeholder='placeholder'
      rounded
      clearable
      outlined
      @keyup.enter='onConfirm'
      input-class='q-pl-sm'
    >
      <template #append>
        <q-btn flat icon='send' @click='onConfirm' />
      </template>
    </q-input>
  </BottomFixArea>
</template>

<script setup lang='ts'>
import { defineModel, defineEmits, defineProps, toRef } from 'vue'

import BottomFixArea from '../fixed/BottomFixArea.vue'

interface Props {
  placeholder: string
}
const props = defineProps<Props>()
const placeholder = toRef(props, 'placeholder')

const message = defineModel<string>()

const emit = defineEmits<{(ev: 'enter', v: string): void}>()

const onConfirm = () => {
  emit('enter', message.value || '')
}

</script>

<style scoped lang='sass'>
</style>
