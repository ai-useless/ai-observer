<template>
  <View>
    <View style='border-bottom: 1px solid gray; padding-bottom: 4px;'>模拟器</View>
    <View style='display: flex; width: 100%; justify-content: space-between; align-items: center; margin-top: 8px; border-bottom: 1px solid lightblue; padding-bottom: 4px;'>
      <View style='font-size: 14px; color: gray;'>定制AGI模拟器</View>
      <View style='display: flex;'>
        <View @click='onSimulatorClick'>
          <Image :src='mic' style='width: 18px; height: 18px;' />
        </View>
      </View>
    </View>
    <View style='display: flex; width: 100%; justify-content: space-between; align-items: center; margin-top: 8px; border-bottom: 1px solid lightblue; padding-bottom: 4px;'>
      <View style='font-size: 14px; color: gray;'>我的AGI模拟器</View>
      <Image :src='chevronRight' style='width: 18px; height: 18px;' />
    </View>
    <View style='display: flex; width: 100%; justify-content: space-between; align-items: center; margin-top: 8px; border-bottom: 1px solid lightblue; padding-bottom: 4px;'>
      <View style='font-size: 14px; color: gray;'>没谱儿的AGI模拟器</View>
      <Image :src='chevronRight' style='width: 18px; height: 18px;' />
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { chevronRight, mic } from 'src/assets'

const onSimulatorClick = () => {
  Taro.navigateTo({
    url: '/pages/simulator/CookSimulatorPage'
  })
}

</script>

<style lang='sass'>
</style>
