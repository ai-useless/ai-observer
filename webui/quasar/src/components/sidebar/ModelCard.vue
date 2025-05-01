<template>
  <div style='padding-bottom: 8px; padding-top: 8px; display: flex; justify-content: center; align-items: center;'>
    <q-img :src='_model.model_logo_url' style='width: 32px; height: 32px; border-radius: 50%;' />
    <div style='margin-left: 8px; width: 100%;'>
      <div style='font-size: 12px; color: black; font-weight: 600;'>
        {{ _model.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { toRef } from 'vue'
import { model } from 'src/localstores'

interface Props {
  model: model._Model
}
// eslint-disable-next-line no-undef
const props = defineProps<Props>()
const _model = toRef(props, 'model')

</script>
