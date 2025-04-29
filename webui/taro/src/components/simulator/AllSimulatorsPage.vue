<template>
  <View style='padding: 16px;'>
    <View v-for='(_simulator, index) in allSimulators' :key='index' style='border-bottom: 1px solid gray'>
      <SimulatorCard :simulator='_simulator' />
    </View>
  </View>
</template>

<script setup lang='ts'>
import { computed, onMounted } from 'vue'
import { View } from '@tarojs/components'
import { simulator } from 'src/localstores'

import SimulatorCard from './SimulatorCard.vue'

const allSimulators = computed(() => simulator.Simulator.allSimulators())

onMounted(() => {
  simulator.Simulator.getSimulators()
})

</script>
