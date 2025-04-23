<template>
  <View class='text-center'>
    <View class='row'>
      <View :class='["avatar", isHost ? "avatar-host" : ""]' :style='{ width: small ? "52px" : "68px" }'>
        <Image :src='simulator.avatar' mode='aspectFill' style='width: 48px; height: 48px;' />
      </View>
    </View>
    <View v-if='!avatarOnly' class='text-grey-8'>
      {{ simulator.name }}
    </View>
  </View>
</template>

<script setup lang='ts'>
import { dbModel } from 'src/model'
import { toRef } from 'vue'
import { View, Image } from '@tarojs/components'

interface Props {
  simulator: dbModel.Simulator
  small: boolean
  avatarOnly?: boolean
  isHost: boolean
}
// eslint-disable-next-line no-undef
const props = defineProps<Props>()
const simulator = toRef(props, 'simulator')
const small = toRef(props, 'small')
const avatarOnly = toRef(props, 'avatarOnly')
const isHost = toRef(props, 'isHost')

</script>

<style scope lang='sass'>
.avatar
  border: 1px solid var(--red-4)
  padding: 1px
  border-radius: 50%

.avatar-host
  border: 1px solid var(--blue-4)
</style>
