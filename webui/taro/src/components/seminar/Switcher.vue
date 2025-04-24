<template>
  <View style='height: 34px; width: 50px;' @click='onSwitchClick'>
    <Image :src='arrowClockwise' style='width: 24px; height: 24px;' />
  </View>
</template>

<script setup lang='ts'>
import { View, Image } from '@tarojs/components'

import { arrowClockwise } from 'src/assets'

const onSwitchClick = () => {
  // TODO:
}

</script>
