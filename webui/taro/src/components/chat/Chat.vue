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
            <Text style='margin-top: 4px; font-size: 12px; color: gray;'>{{ _message.displayTime }}</Text>
          </View>
        </View>
        <Button class='plain-btn' plain v-if='friendThinking' style='text-align: center; font-size: 12px; color: gray; padding: 8px 0; background-color: white;' :loading='true'>对方正在思考...</Button>
      </View>
    </scroll-view>
    <View style='display: flex;'>
      <ComplexInput v-model:prompt='message' v-model:audio-input='audioInput' v-model:height='inputHeight' placeholder='随便聊点儿啥'>
        <template #actions>
          <View style='display: flex;'>
            <View style='height: 24px; width: 24px; padding: 3px 0; margin-left: 4px; margin-right: -4px;' @click='onSendClick'>
              <Image :src='send' style='width: 18px; height: 18px;' />
            </View>
            <View style='height: 24px; background-color: white;' @click='onOpenSelectSimulatorClick'>
              <Image :src='personAvatar' mode='widthFix' style='width: 24px; height: 24px;' />
            </View>
          </View>
        </template>
      </ComplexInput>
    </View>
  </View>
  <AtModal :is-opened='logining' @close='onLoginClose'>
    <AtModalHeader>登录</AtModalHeader>
    <AtModalContent>
      <View>
        <Login :modal='true' />
      </View>
    </AtModalContent>
    <AtModalAction>
      <Button @click='onCancelLoginClick'>取消</Button>
    </AtModalAction>
  </AtModal>
  <AtModal :is-opened='selectingSimulator' @close='onSimulatorSelectorClose'>
    <AtModalHeader>选择模拟器</AtModalHeader>
    <AtModalContent>
      <View>
        <View v-for='(_simulator, index) in simulators' :key='index' style='border-bottom: 1px solid gray;' @click='onSelectSimulatorClick(_simulator)'>
          <SimulatorCard :simulator='_simulator' />
        </View>
      </View>
    </AtModalContent>
    <AtModalAction>
      <Button @click='onCancelSelectSimulatorClick'>取消</Button>
    </AtModalAction>
  </AtModal>
</template>

<script setup lang='ts'>
import { AtModal, AtModalHeader, AtModalContent, AtModalAction } from 'taro-ui-vue3'
import { View, Image, Text, Button } from '@tarojs/components'
import { computed, nextTick, onMounted, ref, toRef, watch } from 'vue'
import Taro from '@tarojs/taro'
import { model, simulator, user } from 'src/localstores'
import { dbBridge, entityBridge } from 'src/bridge'
import { timestamp } from 'src/utils'

import ComplexInput from '../input/ComplexInput.vue'
import Login from '../user/Login.vue'
import SimulatorCard from '../simulator/SimulatorCard.vue'

import { personAvatar, send } from 'src/assets'

interface Props {
  language: string
}

const props = defineProps<Props>()
const language = toRef(props, 'language')

interface Message {
  message: string
  send: boolean
  createdAt: number
  displayTime?: string
  displayName: string
  avatar: string
  hint: boolean
  audio?: string
}

const message = ref('')
const audioError = ref('')

const messages = ref([] as Message[])
const messageCount = computed(() => messages.value.length)

const inputHeight = ref(0)
const chatBoxHeight = ref(0)
const scrollTop = ref(999999)

const simulators = computed(() => simulator.Simulator.allSimulators())
const selectingSimulator = ref(false)

const friend = ref(undefined as unknown as simulator._Simulator)
const _model = ref(undefined as unknown as model._Model)

const userAvatar = computed(() => user.User.displayAvatar() || user.User.avatarUrl())
const username = computed(() => user.User.username())

const audioInput = ref(false)
const friendThinking = ref(false)
const logining = ref(false)

class AudioPlayer {
  context: Taro.InnerAudioContext
  playing: boolean
  duration: number
  durationTicker: number
}

const audioPlayer = ref(undefined as unknown as AudioPlayer)

const playAudio = (audioUrl: string): Promise<AudioPlayer | undefined> => {
  const context = Taro.createInnerAudioContext()
  context.src = audioUrl

  const player = {
    context: context,
    playing: true,
    duration: context.duration
  } as AudioPlayer

  return new Promise((resolve, reject) => {
    context.onError((e) => {
      player.playing = false
      if (player.durationTicker >= 0) {
        window.clearInterval(player.durationTicker)
        player.durationTicker = -1
      }
      reject(`Failed play audio: ${JSON.stringify(e)}`)
    })
    context.onCanplay(() => {
      context.play()

      player.durationTicker = window.setInterval(() => {
        if (context.duration) {
          window.clearInterval(player.durationTicker)
          player.durationTicker = -1
          player.duration = context.duration
          resolve(player)
          return
        }
      }, 100)
    })
    context.onEnded(() => {
      player.playing = false
      if (player.durationTicker >= 0) {
        window.clearInterval(player.durationTicker)
        player.durationTicker = -1
      }
    })
  })
}

const sendToFriend = (_message: string) => {
  friendThinking.value = true
  entityBridge.EChat.chat(friend.value.id, friend.value.simulator, friend.value.origin_personality, username.value, [...messages.value.map((el) => `${el.send ? friend.value.simulator : username.value}: ${el.message}`), _message], _model.value.id, language.value || '中文', (_message?: string, audio?: string, error?: string) => {
    friendThinking.value = false
    if (error && error.length) {
      messages.value.push({
        message: error,
        send: false,
        createdAt: Date.now(),
        displayName: friend.value.simulator,
        hint: true,
        avatar: friend.value.simulator_avatar_url
      })
      return
    }
    messages.value.push({
      message: _message as string,
      send: false,
      createdAt: Date.now(),
      displayName: friend.value.simulator,
      hint: false,
      avatar: friend.value.simulator_avatar_url,
      audio
    })
    if (audio) {
       playAudio(audio).then((player) => {
        if (!player) return
        audioPlayer.value = player
      }).catch((e) => {
        console.log(`Failed play audio: ${e}`)
      })
    }
  })
}

watch(message, () => {
  if (!audioInput.value || !message.value || !message.value.length) return

  messages.value.push({
    message: message.value,
    send: true,
    createdAt: Date.now(),
    displayName: username.value,
    hint: false,
    avatar: userAvatar.value
  })

  sendToFriend(message.value)
  message.value = ''
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

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

const onOpenSelectSimulatorClick = () => {
  selectingSimulator.value = true
}

const onSelectSimulatorClick = (_simulator: simulator._Simulator) => {
  friend.value = _simulator
  selectingSimulator.value = false

  messages.value[0] = {
    message: language.value === '中文' ?
      `您好，我是${friend.value.simulator}，是你在AGI世界的伙伴。我的模型是${_model.value.name}。你可以和我聊任何你想聊的话题，记得要健康哦！如果你想和其他伙伴沟通，可以点击对话框旁边的按钮切换伙伴哦！现在，开始我们愉快的聊天吧！` :
      `Hello, I'm ${friend.value.simulator}, your friend in AGI world. I'm driven by llm model ${_model.value.name}. Now you can talk with me about any topic. If you would like to chat with other guys, switch with button besides the input box. Now let's go!`,
    send: false,
    createdAt: Date.now(),
    displayName: friend.value.simulator,
    hint: true,
    avatar: friend.value.simulator_avatar_url
  }
}

const onSimulatorSelectorClose = () => {
  selectingSimulator.value = false
}

const onCancelSelectSimulatorClick = () => {
  selectingSimulator.value = false
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

  sendToFriend(message.value)
  message.value = ''
}

watch(friend, () => {
  if (!friend.value) return

  Taro.setNavigationBarTitle({
    title: friend.value.simulator
  })
})

watch(inputHeight, () => {
  if (Taro.getWindowInfo()) {
    chatBoxHeight.value = Taro.getWindowInfo().windowHeight - 32 - inputHeight.value
  }
})

const onLoginClose = () => {
  logining.value = false
  Taro.navigateBack()
}

const onCancelLoginClick = () => {
  logining.value = false
  Taro.navigateBack()
}

watch(userAvatar, () => {
  if (userAvatar.value && userAvatar.value.length && username.value && username.value.length) {
    logining.value = false
  }
})

watch(username, () => {
  if (userAvatar.value && userAvatar.value.length && username.value && username.value.length) {
    logining.value = false
  }
})

watch(messageCount, () => {
  nextTick().then(() => scrollTop.value += 1)
  messages.value.forEach((el) => el.displayTime = timestamp.timestamp2HumanReadable(el.createdAt))
})

onMounted(async () => {
  if (!userAvatar.value || !userAvatar.value.length || !username.value || !username.value.length) {
    Taro.login().then((code) => {
      user.User.getUser(code.code)
    }).catch(() => {
      logining.value = true
    })
  }

  if (Taro.getWindowInfo()) {
    chatBoxHeight.value = Taro.getWindowInfo().windowHeight - 32
  }

  model.Model.getModels(() => {
    _model.value = dbBridge._Model.model(dbBridge._Model.chatModelId()) as model._Model
    simulator.Simulator.getSimulators(undefined, () => {
      friend.value = dbBridge._Simulator.randomPeek(undefined)
      messages.value.push({
        message: language.value === '中文' ?
          `您好，我是${friend.value.simulator}，是你在AGI世界的伙伴。我的模型是${_model.value.name}。你可以和我聊任何你想聊的话题，记得要健康哦！如果你想和其他伙伴沟通，可以点击对话框旁边的按钮切换伙伴哦！现在，开始我们愉快的聊天吧！` :
          `Hello, I'm ${friend.value.simulator}, your friend in AGI world. I'm driven by llm model ${_model.value.name}. Now you can talk with me about any topic. If you would like to chat with other guys, switch with button besides the input box. Now let's go!`,
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

<style lang='sass'>
.plain-btn
  border: none !important
  background-color: transparent
  box-shadow: none !important
  padding: 0 !important

.plain-btn::after
  border: none !important
  content: none !important
</style>
