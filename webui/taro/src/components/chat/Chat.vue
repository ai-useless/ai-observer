<template>
  <View>
    <scroll-view
      scrollY={true}
      :scroll-with-animation='true'
      :style='{ height: chatBoxHeight + "px" }'
      :scroll-top='scrollTop'
      showScrollbar={false}
      enhanced={true}
      showsVerticalScrollIndicator={false}
    >
      <View style='font-size: 14px;'>
        <View v-for='(_message, index) in messages' :key='index' :style='{display: "flex", padding: "4px 0", flexDirection: _message.send ? "row-reverse" : "row"}'>
          <View v-if='!_message.send'>
            <Image :src='_message.avatar' style='width: 48px; height: 48px; border-radius: 50%;' />
          </View>
          <View v-else style='margin-left: 8px;'>
            <Image :src='_message.avatar' style='width: 48px; height: 48px; border-radius: 50%;' />
          </View>
          <View style='margin-left: 8px;'>
            <View :style='{backgroundColor: _message.hint ? "rgba(160, 160, 160, 0.2)" : _message.send ? "#07c160" : "white", color: _message.hint ? "black" : _message.send ? "white" : "black", borderRadius: _message.send ? "16px 16px 0 16px" : "16px 16px 16px 0", padding: "8px", border: "1px solid rgba(200, 200, 200, 0.3)"}'>
              <rich-text :nodes='_message.message' />
            </View>
            <Text style='margin-top: 4px; font-size: 12px; color: gray;'>{{ timestamp.timestamp2HumanReadable(_message.createdAt) }}</Text>
          </View>
        </View>
      </View>
    </scroll-view>
    <View style='display: flex; flex-direction: row; align-items: center; width: 100%; height: 24px;'>
      <View style='height: 24px; background-color: white;' @click='onRecordClick'>
        <Image :src='inputAudio ? keyboardAlt : volumeUp' mode='widthFix' style='width: 24px; height: 24px;' />
      </View>
      <View v-if='inputAudio' style='margin-left: 4px; width: 100%; height: 24px;'>
        <AudioRecorder v-model:message='message' v-model:error='audioError' />
      </View>
      <Input
        v-else
        :value='message'
        @input='onChatInput'
        style='font-size: 14px; height: 20px; border: 1px solid gray; border-radius: 4px; padding: 0 8px; width: 100%; margin-left: 4px;'
        placeholder='输入'
      />
      <View v-if='!inputAudio' style='height: 24px; background-color: white; margin-left: 4px;' @click='onSendClick'>
        <Image :src='send' mode='widthFix' style='width: 24px; height: 24px;' />
      </View>
      <View style='display: flex; align-items: center; border: 1px solid gray; border-radius: 8px; height: 24px; background-color: rgba(160, 160, 160, 0.5); margin-left: 4px;'>
        <View style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onSelectSimulatorClick'>
          <Image :src='personAvatar' mode='widthFix' style='width: 24px; height: 24px;' />
        </View>
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Input, Image, Text } from '@tarojs/components'
import { computed, onMounted, ref, watch } from 'vue'
import Taro from '@tarojs/taro'
import { model, simulator, user } from 'src/localstores'
import { dbBridge } from 'src/bridge'
import { timestamp } from 'src/utils'

import AudioRecorder from '../recorder/AudioRecorder.vue'

import { personAvatar, volumeUp, send, keyboardAlt } from 'src/assets'

interface Message {
  message: string
  send: boolean
  createdAt: number
  displayName: string
  avatar: string
  hint: boolean
}

const message = ref('')
const audioError = ref('')

const messages = ref([] as Message[])

const chatBoxHeight = ref(0)
const scrollTop = ref(999999)

const friend = ref(undefined as unknown as simulator._Simulator)
const _model = ref(undefined as unknown as model._Model)

const userAvatar = computed(() => user.User.avatar() || user.User.avatarUrl())
const username = computed(() => user.User.username())

const inputAudio = ref(false)

watch(message, () => {
  if (!inputAudio.value || !message.value || !message.value.length) return

  messages.value.push({
    message: message.value,
    send: true,
    createdAt: Date.now(),
    displayName: username.value,
    hint: false,
    avatar: userAvatar.value
  })

  message.value = ''
})

watch(audioError, () => {
  if (!inputAudio.value || !audioError.value || !audioError.value.length) return

  messages.value.push({
    message: audioError.value,
    send: true,
    createdAt: Date.now(),
    displayName: username.value,
    hint: true,
    avatar: userAvatar.value
  })

  audioError.value = ''
})

const onSelectSimulatorClick = () => {

}

const onRecordClick = () => {
  inputAudio.value = !inputAudio.value
}

const onChatInput = (e: { detail: { value: string } }) => {
  message.value = e.detail.value
}

const onSendClick = () => {
  messages.value.push({
    message: message.value,
    send: true,
    createdAt: Date.now(),
    displayName: username.value,
    hint: false,
    avatar: userAvatar.value
  })
  message.value = ''
}

watch(friend, () => {
  if (!friend.value) return

  Taro.setNavigationBarTitle({
    title: friend.value.simulator
  })
})

onMounted(async () => {
  if (Taro.getWindowInfo()) {
    chatBoxHeight.value = Taro.getWindowInfo().windowHeight - 32
  }

  model.Model.getModels(() => {
    _model.value = dbBridge._Model.model(dbBridge._Model.chatModelId()) as model._Model
    simulator.Simulator.getSimulators(undefined, () => {
      friend.value = dbBridge._Simulator.randomPeek(undefined)
      messages.value.push({
        message: `您好，我是${friend.value.simulator}，是你在AGI世界的伙伴。我的模型是${_model.value.name}。你可以和我聊任何你想聊的话题，记得要健康哦！如果你想和其他伙伴沟通，可以点击对话框旁边的按钮切换伙伴哦！现在，开始我们愉快的聊天吧！`,
        send: false,
        createdAt: Date.now(),
        displayName: friend.value.simulator,
        hint: true,
        avatar: friend.value.simulator_avatar_url
      })
    })
  })
})

</script>
