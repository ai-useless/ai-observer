<template>
  <View style='padding-bottom: 8px; padding-top: 8px; display: flex;'>
    <Image :src='_simulator.simulator_avatar_url' style='width: 48px; height: 48px; border-radius: 50%;' />
    <View style='margin-left: 8px; width: 100%;'>
      <View style='display: flex; justify-content: space-between; align-items: center; width: 100%;'>
        <View style='display: flex; align-items: center;'>
          <View style='font-size: 16px; color: black; font-weight: 600;'>{{ _simulator.simulator }}</View>
          <View style='font-size: 12px; color: gray; margin-left: 4px;'>{{ _simulator.title }}</View>
        </View>
        <View style='display: flex;'>
          <View>
            <Image :src='playCircle' style='width: 16px; height: 16px;' />
          </View>
          <View style="margin-left: 4px;">
            <Image :src='threeDotsVertical' style='width: 16px; height: 16px;' />
          </View>
        </View>
      </View>
      <View style='font-size: 12px; color: gray;'>{{ _simulator.origin_personality }}</View>
      <View style='display: flex; align-items: center; margin-top: 4px;'>
        <Image :src='_simulator.wechat_avatar_url' style='width: 24px; height: 24px; border-radius: 50%;' />
        <Text style='font-size: 12px; color: gray; font-weight: 600; margin-left: 4px;'>{{ _simulator.wechat_username }}</Text>
        <Text style='font-size: 12px; color: gray; margin-left: 4px;'>{{ timestamp.timestamp2HumanReadable(_simulator.timestamp) }}创建</Text>
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { toRef } from 'vue'
import { View, Image, Text } from '@tarojs/components'
import { simulator } from 'src/localstores'
import { timestamp } from 'src/utils'

import { threeDotsVertical, playCircle } from 'src/assets'

// TODO: play audio and report scam

interface Props {
  simulator: simulator._Simulator
}
const props = defineProps<Props>()
const _simulator = toRef(props, 'simulator')

</script>
