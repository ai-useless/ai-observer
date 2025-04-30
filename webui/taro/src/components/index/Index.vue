<template>
  <View style='width: 100%; padding: 0 16px;'>
    <ScratchFrame />
  </View>
</template>

<script setup lang='ts'>
import { View } from '@tarojs/components'

import ScratchFrame from '../seminar/ScratchFrame.vue'
import { onMounted } from 'vue'
import { dbBridge } from 'src/bridge'

onMounted(() => {
  dbBridge._Simulator.initialize()
  dbBridge._Model.initialize()
})

</script>
