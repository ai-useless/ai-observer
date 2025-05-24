<template>
  <div style='padding: 16px;'>
    <div v-for='(_simulator, index) in allSimulators' :key='index' style='border-bottom: 1px solid gray'>
      <SimulatorCard :simulator='_simulator' />
    </div>
  </div>
</template>

<script setup lang='ts'>
import { computed, onMounted } from 'vue'
import { simulator } from 'src/localstores'

import SimulatorCard from './SimulatorCard.vue'

const allSimulators = computed(() => simulator.Simulator.allSimulators())

onMounted(() => {
  simulator.Simulator.getSimulators()
})

</script>
