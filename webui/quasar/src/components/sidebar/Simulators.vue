<template>
  <div>
    <div style='font-size: 14px; color: gray;'>
      在线的模拟器
    </div>
    <q-separator />
    <div style='max-height: 400px; overflow: scroll;'>
      <div v-for='_simulator in simulators' :key='_simulator.simulator' class='cursor-pointer'>
        <SimulatorCard :simulator='_simulator' />
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { simulator } from 'src/localstores'
import { computed, onMounted } from 'vue'

import SimulatorCard from './SimulatorCard.vue'

const simulators = computed(() => simulator.Simulator.allSimulators())

onMounted(() => {
  simulator.Simulator.getSimulators()
})

</script>
