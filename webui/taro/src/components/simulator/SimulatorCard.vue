<template>
  <View style='padding-bottom: 8px; padding-top: 8px; display: flex;'>
    <View style='text-align: center;'>
      <Image :src='_simulator.simulator_avatar_url' style='width: 48px; height: 48px; border-radius: 50%;' />
    </View>
    <View style='margin-left: 8px; width: 100%;'>
      <View style='display: flex; align-items: center; width: 100%; flex-wrap: wrap;'>
        <View style='font-size: 16px; color: black; font-weight: 600;'>{{ _simulator.simulator }}</View>
        <View style='margin-left: 4px; display: flex; height: 100%; padding-top: 2px;' @click='onPlayClick'>
          <Image :src='playCircle' style='width: 16px; height: 16px;' />
        </View>
        <View v-if='showLanguage' style='margin-left: 4px; font-size: 12px; color: lightblue; line-height: 16px;' @click='onOpenSelectLanguageClick'>
          {{ _simulator.language }}
        </View>
        <View v-if='showActions' style='display: flex; flex-direction: row-reverse; height: 100%; padding-top: 2px; flex: 1;' @click='onActionClick'>
          <Image :src='threeDotsVertical' style='width: 16px; height: 16px;' />
        </View>
      </View>
      <View style='font-size: 12px; color: gray; display: flex; align-items: center;'>{{ _simulator.title }}</View>
      <View v-if='!simple' style='font-size: 12px; color: gray;'>{{ _simulator.origin_personality }}</View>
      <View v-if='!simple' style='display: flex; align-items: center; margin-top: 4px;'>
        <Image :src='_simulator.wechat_avatar_url' style='width: 24px; height: 24px; border-radius: 50%;' />
        <Text style='font-size: 12px; color: gray; font-weight: 600; margin-left: 4px;'>{{ _simulator.wechat_username }}</Text>
        <Text style='font-size: 12px; color: gray; margin-left: 4px;'>{{ timestamp.timestamp2HumanReadable(_simulator.timestamp) }}创建</Text>
      </View>
    </View>
  </View>
  <AtModal :is-opened='selectingLanguage' @close='onLanguageSelectorClose'>
    <AtModalHeader>选择语言</AtModalHeader>
    <AtModalContent style='padding-top: 0 !important;'>
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
  <AtActionSheet
    v-if='showPopupMenu && showActions'
    :isOpened='showPopupMenu'
    cancelText='取消'
    @close='showPopupMenu = false'
    @cancel='showPopupMenu = false'
  >
    <AtActionSheetItem v-if='enableActionReview'>通过</AtActionSheetItem>
    <AtActionSheetItem v-if='enableActionReview'>拒绝</AtActionSheetItem>
    <AtActionSheetItem v-if='enableActionReport'>举报</AtActionSheetItem>
  </AtActionSheet>
</template>

<script setup lang='ts'>
import { ref, toRef } from 'vue'
import { View, Image, Text, Button } from '@tarojs/components'
import { AtModal, AtModalHeader, AtModalContent, AtModalAction, AtActionSheet, AtActionSheetItem } from 'taro-ui-vue3'
import { simulator } from 'src/localstores'
import { timestamp } from 'src/utils'
import { dbBridge } from 'src/bridge'
import { AudioPlayer } from 'src/player'

import { playCircle, threeDotsVertical } from 'src/assets'

// TODO: play audio and report scam

interface Props {
  simulator: simulator._Simulator
  canSetLanguage?: boolean
  simple?: boolean
  showActions?: boolean
  showLanguage?: boolean
  enableActionReport?: boolean
  enableActionReview?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  showLanguage: true
})
const _simulator = toRef(props, 'simulator')
const canSetLanguage = toRef(props, 'canSetLanguage')
const simple = toRef(props, 'simple')
const showActions = toRef(props, 'showActions')
const showLanguage = toRef(props, 'showLanguage')
const enableActionReport = toRef(props, 'enableActionReport')
const enableActionReview = toRef(props, 'enableActionReview')

const _languages = dbBridge._Language.languages()
const selectingLanguage = ref(false)
const showPopupMenu = ref(false)

const playing = ref(false)

const onLanguageSelectorClose = () => {
  selectingLanguage.value = false
}

const onCancelSelectLanguageClick = () => {
  if (!canSetLanguage.value) return
  selectingLanguage.value = false
}

const onOpenSelectLanguageClick = (e: { stopPropagation: () => void }) => {
  e.stopPropagation()
  selectingLanguage.value = true
}

const onActionClick = (e: { stopPropagation: () => void }) => {
  e.stopPropagation()
  showPopupMenu.value = true
}

const onPlayClick = (e: { stopPropagation: () => void }) => {
  e.stopPropagation()
  playing.value = true
  void AudioPlayer.play(_simulator.value.audio_url, undefined, () => {
    playing.value = false
  })
}

const onSelectLanguageClick = (_language: string) => {
  selectingLanguage.value = false
  _simulator.value.language = _language
}

</script>

<style lang='sass'>
.at-modal__content
  padding-top: 0 !important
  padding-bottom: 0 !important
</style>
