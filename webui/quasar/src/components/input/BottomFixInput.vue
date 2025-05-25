<template>
  <BottomFixArea :max-width='maxWidth' :width='width'>
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
      class='bg-white'
    >
      <template #append>
        <q-btn
          dense
          rounded
          flat
          icon='send'
          @click='onConfirm'
        />
      </template>
    </q-input>
  </BottomFixArea>
</template>

<script setup lang='ts'>
import { defineModel, defineEmits, defineProps, toRef, withDefaults } from 'vue'

import BottomFixArea from '../fixed/BottomFixArea.vue'

interface Props {
  placeholder: string
  disabled?: boolean
  loading?: boolean
  maxWidth?: string
  width?: string
}
const props = withDefaults(defineProps<Props>(), {
  maxWidth: 'calc(100% - 8px)',
  width: '600px'
})
const placeholder = toRef(props, 'placeholder')
const disabled = toRef(props, 'disabled')
const maxWidth = toRef(props, 'maxWidth')

const message = defineModel<string>()

const emit = defineEmits<{(ev: 'enter', v: string): void}>()

const onConfirm = () => {
  emit('enter', message.value || '')
}

</script>

<style scoped lang='sass'>
</style>
