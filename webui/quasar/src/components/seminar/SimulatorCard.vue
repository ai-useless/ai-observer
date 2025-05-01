<template>
  <div class='text-center'>
    <div class='row'>
      <q-space />
      <div :class='["avatar", isHost ? "avatar-host" : ""]' :style='{ width: small ? "52px" : "68px" }'>
        <q-avatar :size='small ? "48px" : "64px"'>
          <q-img :src='_simulator.simulator_avatar_url' />
        </q-avatar>
      </div>
      <q-space />
    </div>
    <div v-if='!avatarOnly' class='text-grey-8'>
      {{ _simulator.simulator }}
    </div>
  </div>
</template>

<script setup lang='ts'>
import { simulator } from 'src/localstores'
import { toRef } from 'vue'

interface Props {
  simulator: simulator._Simulator
  small: boolean
  avatarOnly?: boolean
  isHost: boolean
}
// eslint-disable-next-line no-undef
const props = defineProps<Props>()
const _simulator = toRef(props, 'simulator')
const small = toRef(props, 'small')
const avatarOnly = toRef(props, 'avatarOnly')
const isHost = toRef(props, 'isHost')

</script>

<style scope lang='sass'>
.avatar
  border: 1px solid $red-4
  padding: 1px
  border-radius: 50%

.avatar-host
  border: 1px solid $blue-4
</style>
