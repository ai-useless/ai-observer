<template>
  <View style='padding: 16px;'>
    <Login />
    <Simulator style=' margin-top: 24px;' />
    <Tip style=' margin-top: 24px;' />
  </View>
</template>

<script setup lang='ts'>
import { View } from '@tarojs/components'

import Login from './Login.vue'
import Simulator from './Simulator.vue'
import Tip from './Tip.vue'

</script>

<style lang='sass'>
</style>
