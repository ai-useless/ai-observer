<template>
  <View style='padding: 16px;'>
    <View v-for='(_simulator, index) in mySimulators' :key='index' style='border-bottom: 1px solid gray;'>
      <SimulatorCard :simulator='_simulator' />
    </View>
  </View>
</template>

<script setup lang='ts'>
import { computed, onMounted } from 'vue'
import { simulator } from 'src/localstores'

import SimulatorCard from './SimulatorCard.vue'

const mySimulators = computed(() => simulator.Simulator.mySimulators())

onMounted(() => {
  simulator.Simulator.getSimulators(undefined, undefined, true)
})

</script>
