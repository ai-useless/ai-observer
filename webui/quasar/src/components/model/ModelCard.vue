<template>
  <q-item dense clickable class='row q-py-sm border-radius-8px'>
    <q-avatar size='56px'>
      <q-img :src='_model.model_logo_url' />
    </q-avatar>
    <q-item-label class='q-ml-md' style='width: calc(100% - 56px - 16px);'>
      <div class='row'>
        <div class='text-bold text-grey-9'>
          {{ _model.name }}
        </div>
      </div>
      <div v-if='_model' class='q-mt-xs row'>
        <div class='border-gradient-bg-white border-radius-round' style='width: 26px;'>
          <q-avatar v-if='_model' size='24px'>
            <q-img :src='_model.model_logo_url' />
          </q-avatar>
        </div>
        <div class='border-gradient-bg-white border-radius-round q-ml-xs' style='width: 26px;'>
          <q-avatar v-if='_model' size='24px'>
            <q-img :src='_model.author_logo_url' />
          </q-avatar>
        </div>
        <div class='border-gradient-bg-white border-radius-round q-ml-xs' style='width: 26px;'>
          <q-avatar v-if='_model' size='24px'>
            <q-img :src='_model.vendor_logo_url' />
          </q-avatar>
        </div>
      </div>
    </q-item-label>
  </q-item>
</template>

<script setup lang='ts'>
import { model } from '../../localstores'
import { defineProps, toRef } from 'vue'

interface Props {
  model: model._Model
}
const props = defineProps<Props>()
const _model = toRef(props, 'model')

</script>
