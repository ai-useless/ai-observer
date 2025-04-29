<template>
  <View style='padding: 16px;'>
    <View v-for='(_simulator, index) in mySimulators' :key='index' style='border-bottom: 1px solid gray'>
      <SimulatorCard :simulator='_simulator' />
    </View>
  </View>
</template>

<script setup lang='ts'>
import { computed, onMounted } from 'vue'
import { View } from '@tarojs/components'
import { simulator } from 'src/localstores'
import Taro from '@tarojs/taro'

import SimulatorCard from './SimulatorCard.vue'

const mySimulators = computed(() => simulator.Simulator.mySimulators())

onMounted(() => {
  Taro.login().then((code) => {
    simulator.Simulator.getSimulators(code.code)
  }).catch(() => {
    Taro.showToast({
      title: '认证失败！',
      icon: 'error',
      duration: 1000
    })
  })
})

</script>
