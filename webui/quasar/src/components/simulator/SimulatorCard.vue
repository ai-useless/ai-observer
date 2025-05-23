<template>
  <div class='row'>
    <q-avatar size='56px'>
      <q-img :src='_simulator.simulator_avatar_url' />
    </q-avatar>
    <q-item-label class='q-ml-md' style='width: calc(100% - 56px - 16px);'>
      <div class='row'>
        <div class='text-bold text-grey-9 q-pr-xs'>
          {{ _simulator.simulator }}
        </div>
        <div class='text-grey-6 single-line-nowrap q-mr-xs' style='font-size: 12px; max-width: 120px;'>
          {{ _simulator.title }}
        </div>
        <div
          class='text-blue-4 q-mr-xs'
          style='font-size: 12px;'
        >
          试听
        </div>
        <div
          v-if='canSetLanguage'
          class='text-blue-4'
          style='font-size: 12px;'
        >
          方言
        </div>
      </div>
      <div v-if='!simple' class='q-mt-xs text-grey-6' style='font-size: 12px;'>
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
  canSetLanguage?: boolean
  simple?: boolean
}
const props = defineProps<Props>()
const _simulator = toRef(props, 'simulator')
const canSetLanguage = toRef(props, 'canSetLanguage')
const simple = toRef(props, 'simple')

</script>
