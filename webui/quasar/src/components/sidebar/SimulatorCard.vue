<template>
  <div style='padding-bottom: 8px; padding-top: 8px; display: flex; padding: 8px;'>
    <div style='text-align: center;'>
      <q-img :src='_simulator.simulator_avatar_url' style='width: 32px; height: 32px; border-radius: 50%;' />
    </div>
    <div style='margin-left: 8px; width: 100%;'>
      <div style='display: flex; justify-content: space-between; align-items: center; width: 100%;'>
        <div style='font-size: 16px; color: black; font-weight: 600;'>
          {{ _simulator.simulator }}
        </div>
        <div style='display: flex;'>
          <div>
            <q-img :src='playCircle' style='width: 16px; height: 16px;' />
          </div>
          <div style='margin-left: 4px;'>
            <q-img :src='threeDotsVertical' style='width: 16px; height: 16px;' />
          </div>
        </div>
      </div>
      <div style='font-size: 12px; color: gray; margin-left: 4px;'>
        {{ _simulator.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { toRef } from 'vue'
import { simulator } from 'src/localstores'

import { threeDotsVertical, playCircle } from 'src/assets'

// TODO: play audio and report scam

interface Props {
  simulator: simulator._Simulator
}
// eslint-disable-next-line no-undef
const props = defineProps<Props>()
const _simulator = toRef(props, 'simulator')

</script>
