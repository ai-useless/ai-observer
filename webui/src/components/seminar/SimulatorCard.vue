<template>
  <div class='text-center'>
    <q-avatar :size='small ? "32px" : "64px"'>
      <q-img :src='simulator.avatar' />
    </q-avatar>
    <div v-if='!avatarOnly' class='text-grey-8'>
      {{ $t(simulator.name) }}
    </div>
  </div>
</template>

<script setup lang='ts'>
import { dbModel } from 'src/model'
import { toRef } from 'vue'

interface Props {
  simulator: dbModel.Simulator
  small: boolean
  avatarOnly?: boolean
}
// eslint-disable-next-line no-undef
const props = defineProps<Props>()
const simulator = toRef(props, 'simulator')
const small = toRef(props, 'small')
const avatarOnly = toRef(props, 'avatarOnly')

</script>
