<template>
  <View style='padding-bottom: 8px; padding-top: 8px; display: flex;'>
    <Image :src='_model.model_logo_url' style='width: 48px; height: 48px; border-radius: 50%;' />
    <View style='margin-left: 8px; width: 100%;'>
      <View style='display: flex; justify-content: space-between; align-items: center; width: 100%;'>
        <View style='font-size: 16px; color: black; font-weight: 600;'>{{ _model.name }}</View>
        <View style='font-size: 12px; color: gray; margin-left: 4px;'>{{ _model.vendor }}</View>
      </View>
      <View style='display: flex; align-items: center; margin-top: 4px;'>
        <Image :src='_model.vendor_logo_url' style='width: 24px; height: 24px; border-radius: 50%;' />
        <Image :src='_model.author_logo_url' style='width: 24px; height: 24px; border-radius: 50%;' />
        <Text style='font-size: 12px; color: gray; margin-left: 4px;'>{{ timestamp.timestamp2HumanReadable(_model.timestamp) }}创建</Text>
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { toRef } from 'vue'
import { View, Image, Text } from '@tarojs/components'
import { model } from 'src/localstores'
import { timestamp } from 'src/utils'

interface Props {
  model: model._Model
}
const props = defineProps<Props>()
const _model = toRef(props, 'model')

</script>
