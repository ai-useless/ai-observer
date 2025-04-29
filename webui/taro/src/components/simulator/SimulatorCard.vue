<template>
  <View style='padding-bottom: 8px;'>
    <View style='display: flex; align-items: center;'>
      <Image :src='_simulator.simulator_avatar_url' style='width: 24px; height: 24px;' />
      <Text style='font-size: 12px; color: gray; font-weight: 600; margin-left: 4px;'>{{ _simulator.simulator }}</Text>
      <Text style='font-size: 12px; color: gray; margin-left: 8px;'>{{ _simulator.origin_personality }}</Text>
    </View>
    <View style='display: flex; align-items: center;'>
      <Image :src='_simulator.wechat_avatar' style='width: 24px; height: 24px; border-radius: 50%;' />
      <Text style='font-size: 12px; color: gray; font-weight: 600; margin-left: 4px;'>{{ _simulator.wechat_username }}</Text>
      <Text style='font-size: 12px; color: gray; margin-left: 4px;'>{{ timestamp.timestamp2HumanReadable(_simulator.timestamp) }}</Text>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { toRef } from 'vue'
import { View, Image, Text } from '@tarojs/components'
import { simulator } from 'src/localstores'
import { timestamp } from 'src/utils';

interface Props {
  simulator: simulator._Simulator
}
const props = defineProps<Props>()
const _simulator = toRef(props, 'simulator')

</script>
