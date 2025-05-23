<template>
  <View style='padding-bottom: 8px; padding-top: 8px; display: flex;'>
    <View style='text-align: center;'>
      <Image :src='_simulator.simulator_avatar_url' style='width: 48px; height: 48px; border-radius: 50%;' />
    </View>
    <View style='margin-left: 8px; width: 100%;'>
      <View style='display: flex; justify-content: space-between; align-items: center; width: 100%;'>
        <View style='display: flex; align-items: center;'>
          <View style='font-size: 16px; color: black; font-weight: 600;'>{{ _simulator.simulator }}</View>
          <View style='font-size: 12px; color: gray; margin-left: 4px;'>{{ _simulator.title }}</View>
        </View>
        <View style='display: flex;'>
          <View>
            <Image :src='playCircle' style='width: 16px; height: 16px;' />
          </View>
          <View style='margin-left: 4px;'>

          </View>
          <View style='margin-left: 4px; font-size: 14px; color: lightblue; line-height: 16px;' @click='onOpenSelectLanguageClick'>
            {{ _simulator.language }}
          </View>
        </View>
      </View>
      <View style='font-size: 12px; color: gray;'>{{ _simulator.origin_personality }}</View>
      <View style='display: flex; align-items: center; margin-top: 4px;'>
        <Image :src='_simulator.wechat_avatar_url' style='width: 24px; height: 24px; border-radius: 50%;' />
        <Text style='font-size: 12px; color: gray; font-weight: 600; margin-left: 4px;'>{{ _simulator.wechat_username }}</Text>
        <Text style='font-size: 12px; color: gray; margin-left: 4px;'>{{ timestamp.timestamp2HumanReadable(_simulator.timestamp) }}创建</Text>
      </View>
    </View>
  </View>
  <AtModal :is-opened='selectingLanguage' @close='onLanguageSelectorClose'>
    <AtModalHeader>选择语言</AtModalHeader>
    <AtModalContent>
      <View>
        <View v-for='(_language, index) in _languages' :key='index' style='padding: 8px;' @click='onSelectLanguageClick(_language)'>
          <View :style='{ color: _language === _simulator.language ? "lightblue" : "gray" }'>{{ _language }}</View>
        </View>
      </View>
    </AtModalContent>
    <AtModalAction>
      <Button @click='onCancelSelectLanguageClick'>取消</Button>
    </AtModalAction>
  </AtModal>
</template>

<script setup lang='ts'>
import { ref, toRef } from 'vue'
import { View, Image, Text, Button } from '@tarojs/components'
import { AtModal, AtModalHeader, AtModalContent, AtModalAction } from 'taro-ui-vue3'
import { simulator } from 'src/localstores'
import { timestamp } from 'src/utils'
import { dbBridge } from 'src/bridge'

import { playCircle } from 'src/assets'

// TODO: play audio and report scam

interface Props {
  simulator: simulator._Simulator
}
const props = defineProps<Props>()
const _simulator = toRef(props, 'simulator')

const _languages = dbBridge._Language.languages()
const selectingLanguage = ref(false)

const onLanguageSelectorClose = () => {
  selectingLanguage.value = false
}

const onCancelSelectLanguageClick = () => {
  selectingLanguage.value = false
}

const onOpenSelectLanguageClick = () => {
  selectingLanguage.value = true
}

const onSelectLanguageClick = (_language: string) => {
  selectingLanguage.value = false
  _simulator.value.language = _language
}

</script>
