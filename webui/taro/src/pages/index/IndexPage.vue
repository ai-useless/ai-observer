<template>
  <View>
    HHHHHHHHHHHH
  </View>
</template>

<script setup lang='ts'>
import { View } from '@tarojs/components'
import { computed } from 'vue'
import { setting } from 'src/localstores'
import Taro, { useDidShow } from '@tarojs/taro'

import './index.sass'

const tabIndex = computed(() => setting.Setting.tabIndex())

useDidShow(() => {
  if (tabIndex.value < 0) {
    setting.Setting.setTabIndex(1)
    Taro.switchTab({ url: '/pages/seminar/SeminarPage' })
  }
})

</script>
