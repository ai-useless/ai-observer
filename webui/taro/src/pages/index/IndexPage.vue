<template>
  <View v-if='tabIndex >= 0 && showMe'>
    <Index />
  </View>
</template>

<script setup lang='ts'>
import { View } from '@tarojs/components'
import { computed, ref } from 'vue'
import { setting } from 'src/localstores'
import Taro, { useDidShow } from '@tarojs/taro'

import './index.sass'
import Index from 'src/components/index/Index.vue'

const tabIndex = computed(() => setting.Setting.tabIndex())
const showMe = ref(false)

useDidShow(async () => {
  if (tabIndex.value < 0) {
    setting.Setting.setTabIndex(1)
    Taro.switchTab({ url: '/pages/seminar/SeminarPage' })
  } else {
    showMe.value = true
  }
})

</script>
