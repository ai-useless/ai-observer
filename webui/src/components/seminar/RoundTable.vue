<template>
  <div>
    <q-fab
      color='red-8'
      vertical-actions-align='left'
      direction='up'
      padding='8px 16px'
    >
      <q-fab-action color='primary' icon='mail' />
      <q-fab-action color='secondary' icon='alarm' />
      <template #icon>
        <q-icon :name='inScratch ? "bi-hourglass-split" : "bi-chevron-up"' size='16px' />
      </template>
      <template #label>
        <div class='row'>
          <span>{{ label }}</span>
          <q-icon name='bi-person-circle' style='margin-left: 8px;' />
        </div>
      </template>
    </q-fab>
  </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { setting } from 'src/localstore'

const inScratch = computed(() => setting.Setting.inScratch())
const label = computed(() => inScratch.value ? 'Preparing ...' : 'Expand guests')

</script>
