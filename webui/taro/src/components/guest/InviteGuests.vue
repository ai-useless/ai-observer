<template>
  <View>
    <View>
      <View @click='onSelectGuestClick'>选择嘉宾</View>
    </View>
    <Button
      @click='onStartDiscussClick'
      size='mini'
      style='width: calc(100% - 32px); margin-top: 16px; border-radius: 8px; color: blue;'
    >
      开始讨论
    </Button>
    <View>模拟器</View>
    <View>AGI模型</View>
  </View>
  <AtModal :is-opened='selecting'>
    <AtModalHeader>选择主持人</AtModalHeader>
    <AtModalContent>
      这是一个简单的确认对话框内容。
    </AtModalContent>
    <AtModalAction>
      <Button @click='onCancelClick'>取消</Button>
      <Button @click='onConfirmClick'>确定</Button>
    </AtModalAction>
  </AtModal>
</template>

<script setup lang='ts'>
import Taro from '@tarojs/taro'
import { onMounted, ref } from 'vue'
import { AtModal, AtModalHeader, AtModalContent, AtModalAction } from 'taro-ui-vue3'

import { View, Button } from '@tarojs/components'

const guests = ref(0)
const selecting = ref(false)

const onStartDiscussClick = () => {
  Taro.switchTab({ url: '/pages/seminar/SeminarPage' })
}

onMounted(() => {
  guests.value = Math.floor(Math.random() * 3) + 7
})

const onSelectGuestClick = () => {
  selecting.value = true
}

const onCancelClick = () => {
  // TODO:
}

const onConfirmClick = () => {
  // TODO:
}

</script>
