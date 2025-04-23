<template>
  <View>
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
import { computed } from 'vue'
import { View } from '@tarojs/components'

import ScratchFrame from './ScratchFrame.vue'
import Conference from './Conference.vue'

const inScratch = computed(() => setting.Setting.inScratch())

</script>

<style scoped lang='sass'>
</style>
