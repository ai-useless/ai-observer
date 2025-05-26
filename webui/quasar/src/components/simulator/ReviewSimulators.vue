<template>
  <div class='full-height full-width'>
    <q-scroll-area
      ref='chatBox'
      :bar-style='{ width: "2px" }'
      :thumb-style='{ width: "2px" }'
      class='q-mt-xs cursor-pointer full-height full-width'
    >
      <div v-for='(_simulator, index) in allSimulators' :key='index'>
        <SimulatorCard :simulator='_simulator' show-actions enable-action-review :show-language='false' v-model:playing='playing' />
      </div>
    </q-scroll-area>
  </div>
</template>

<script setup lang='ts'>
import { computed, onMounted, ref } from 'vue'
import { simulator } from 'src/localstores'

import SimulatorCard from './SimulatorCard.vue'

const allSimulators = computed(() => simulator.Simulator.reviewingSimulators())

const playing = ref(false)

onMounted(() => {
  simulator.Simulator.getSimulators()
})

</script>
