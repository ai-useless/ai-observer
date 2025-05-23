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
      :disable='disabled'
      :loading='loading'
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
  disabled?: boolean
  loading?: boolean
}
const props = defineProps<Props>()
const placeholder = toRef(props, 'placeholder')
const disabled = toRef(props, 'disabled')

const message = defineModel<string>()

const emit = defineEmits<{(ev: 'enter', v: string): void}>()

const onConfirm = () => {
  emit('enter', message.value || '')
}

</script>

<style scoped lang='sass'>
</style>
