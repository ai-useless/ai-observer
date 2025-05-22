<template>
  <div class='row'>
    <q-avatar size='56px'>
      <q-img :src='_simulator.simulator_avatar_url' />
    </q-avatar>
    <q-item-label class='q-ml-md' style='width: calc(100% - 56px - 16px);'>
      <div class='row'>
        <div class='text-bold text-grey-9'>
          {{ _simulator.simulator }}
        </div>
        <div class='text-grey-6 single-line-nowrap q-ml-xs' style='font-size: 12px; max-width: 120px;'>
          {{ _simulator.title }}
        </div>
        <div
          class='text-blue-4 q-px-xs'
          style='font-size: 12px;'
        >
          试听
        </div>
      </div>
      <div class='q-mt-xs text-grey-6' style='font-size: 12px;'>
        {{ _simulator.origin_personality }}
      </div>
    </q-item-label>
  </div>
</template>

<script setup lang='ts'>
import { simulator } from 'src/localstores'
import { defineProps, toRef } from 'vue'

interface Props {
  simulator: simulator._Simulator
}
const props = defineProps<Props>()
const _simulator = toRef(props, 'simulator')

</script>
