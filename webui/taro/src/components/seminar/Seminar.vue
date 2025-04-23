<template>
  <View v-if='initialized'>
    <View v-if='inScratch' style='padding-bottom: 64px;'>
      <ScratchFrame />
    </View>
    <View v-else style='width: 100%;'>
      <Conference />
    </View>
  </View>
</template>

<script setup lang='ts'>
import { setting } from 'src/localstores'
import { computed, onMounted, ref } from 'vue'
import { View } from '@tarojs/components'
import { dbBridge } from 'src/bridge'

import ScratchFrame from './ScratchFrame.vue'
import Conference from './Conference.vue'

const inScratch = computed(() => setting.Setting.inScratch())
const initialized = ref(false)

onMounted(() => {
  dbBridge._Simulator.initialize()
  dbBridge._Model.initialize()
  initialized.value = true
})

</script>

<style scoped lang='sass'>
</style>
