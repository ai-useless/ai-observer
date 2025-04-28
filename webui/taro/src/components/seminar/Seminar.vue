<template>
  <View style='width: 100%;'>
    <Conference />
    <View style='display: flex; flex-direction: row-reverse; margin-top: -32px;'>
      <Switcher style='position: absolute;' />
    </View>
  </View>
</template>

<script setup lang='ts'>
import { onMounted } from 'vue'
import { View } from '@tarojs/components'
import { dbBridge } from 'src/bridge'

import Conference from './Conference.vue'
import Switcher from './Switcher.vue'

onMounted(() => {
  dbBridge._Simulator.initialize()
  dbBridge._Model.initialize()
})

</script>

<style scoped lang='sass'>
</style>
