<template>
  <View style='width: 100%; padding: 0 16px;'>
    <Conference />
  </View>
</template>

<script setup lang='ts'>
import { onMounted } from 'vue'
import { View } from '@tarojs/components'
import { dbBridge } from 'src/bridge'

import Conference from './Conference.vue'

onMounted(() => {
  dbBridge._Simulator.initialize()
  dbBridge._Model.initialize()
})

</script>

<style scoped lang='sass'>
</style>
