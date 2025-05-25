<template>
  <div>
    <SimulatorSelector
      v-model:selected='_simulator'
      @selected='onSimulatorSelected'
      title='模拟器列表'
      :title-height='16'
      :title-font-size='16'
      :width='300'
      :list-height='440'
      :simple='true'
      :can-set-language='true'
    />
  </div>
</template>

<script setup lang='ts'>
import { defineModel, defineEmits } from 'vue'
import { simulator } from 'src/localstores'

import SimulatorSelector from '../selector/SimulatorSelector.vue'

const _simulator = defineModel<simulator._Simulator>('selected')

const emit = defineEmits<{(ev: 'selected', simulator: simulator._Simulator): void}>()

const onSimulatorSelected = (_simulator: simulator._Simulator) => {
  emit('selected', _simulator)
}

</script>
