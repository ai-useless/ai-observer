<template>
  <div v-if='!mySimulators.length'>
    <q-btn
      flat
      dense
      rounded
      class='full-width border-gradient-bg-white text-grey-8'
      @click='onCreateSimulatorClick'
    >
      还没有自己的模拟器？现在去创建一个~
    </q-btn>
  </div>
  <View style='padding: 16px;'>
    <View v-for='(_simulator, index) in mySimulators' :key='index' style='border-bottom: 1px solid gray;'>
      <SimulatorCard :simulator='_simulator' />
    </View>
  </View>
</template>

<script setup lang='ts'>
import { computed, onMounted } from 'vue'
import { setting, simulator } from 'src/localstores'

import SimulatorCard from './SimulatorCard.vue'

const mySimulators = computed(() => simulator.Simulator.mySimulators())

onMounted(() => {
  simulator.Simulator.getSimulators(undefined, undefined, true)
})

const onCreateSimulatorClick = () => {
  setting.Setting.setCurrentSettingMenu('createSimulator')
}

</script>
