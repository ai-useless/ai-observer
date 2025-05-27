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
        <View v-for='(_message, index) in displayMessages' :key='index'>
          <MessageCard :message='_message' />
        </View>
        <MessageCard v-if='lastDisplayMessage' :message='lastDisplayMessage' />
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
        <View v-for='(_simulator, index) in simulators' :key='index' style='border-bottom: 1px solid lightgray;' @click='onSelectSimulatorClick(_simulator)'>
          <SimulatorCard :simulator='_simulator' :show-language='language !== "英语"' simple v-model:playing='rolePlaying' />
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
import { View, Image, Button } from '@tarojs/components'
import { computed, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'
import Taro from '@tarojs/taro'
import { model, simulator, user } from 'src/localstores'
import { dbBridge, entityBridge } from 'src/bridge'
import { AudioPlayer } from 'src/player'
import { typing as _typing, Message as MessageBase } from 'src/typing'

import ComplexInput from '../input/ComplexInput.vue'
import Login from '../user/Login.vue'
import SimulatorCard from '../simulator/SimulatorCard.vue'
import MessageCard from './MessageCard.vue'

import { personAvatar, send } from 'src/assets'

interface Props {
  language: string
}

const props = defineProps<Props>()
const language = toRef(props, 'language')

interface Message extends MessageBase {
  send: boolean
  displayName: string
  avatar: string
  hint: boolean
  simulatorId: number
}

const message = ref('')
const audioError = ref('')

const displayMessages = ref([] as Message[])
const nextRequestIndex = ref(0)
const waitMessages = ref(new Map<string, Message>())
const lastDisplayMessage = ref(undefined as unknown as Message)
const typingMessage = ref(undefined as unknown as Message)
const typingMessageIndex = ref(0)

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

const rolePlaying = ref(false)
const audioPlayer = ref(undefined as unknown as AudioPlayer)
const typingInterval = ref(80)
const typingTicker = ref(-1)

const sendToFriend = (_message: string, requestIndex: number, simulatorId: number) => {
  friendThinking.value = true

  const messages = [...displayMessages.value, ...(typingMessage.value ? [typingMessage.value] : []), ...Array.from(waitMessages.value.values())]

  entityBridge.EChat.chat(
    friend.value.id,
    friend.value.simulator,
    friend.value.origin_personality,
    username.value,
    [
      ...messages.map((el) => `${el.send ? username.value : friend.value.simulator}说: ${el.message}`),
      `${friend.value.simulator}说: ${_message}`
    ],
    _model.value.id,
    language.value === undefined ? '中文' : language.value,
    language.value === '英语',
    (_message?: string, audio?: string, error?: string) => {
    if (error && error.length) {
      waitMessages.value.set(`${error}-${requestIndex}`, {
        message: error,
        send: false,
        timestamp: Date.now(),
        displayName: friend.value.simulator,
        hint: true,
        avatar: friend.value.simulator_avatar_url,
        index: requestIndex,
        audio: undefined as unknown as string,
        simulatorId
      })
      return
    }
    waitMessages.value.set(`${error}-${requestIndex}`, {
      message: _message as string,
      send: false,
      timestamp: Date.now(),
      displayName: friend.value.simulator,
      hint: false,
      avatar: friend.value.simulator_avatar_url,
      index: requestIndex,
      audio: audio as string,
      simulatorId
    })
  })
}

watch(message, () => {
  if (!audioInput.value || !message.value || !message.value.length) return

  displayMessages.value.push({
    message: message.value,
    send: true,
    timestamp: Date.now(),
    displayName: username.value,
    hint: false,
    avatar: userAvatar.value,
    index: -1,
    audio: undefined as unknown as string,
    simulatorId: -1
  })

  sendToFriend(message.value, nextRequestIndex.value++, friend.value.id)
  message.value = ''
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

  displayMessages.value.push({
    message: audioError.value,
    send: true,
    timestamp: Date.now(),
    displayName: username.value,
    hint: true,
    avatar: userAvatar.value,
    index: -1,
    audio: undefined as unknown as string,
    simulatorId: -1
  })

  audioError.value = ''
})

const onOpenSelectSimulatorClick = () => {
  selectingSimulator.value = true
}

const initializeMessage = () => {
  displayMessages.value = [{
    message: language.value === '中文'
      ? `您好，我是${friend.value.simulator}，是你在AGI世界的伙伴。我的模型是${_model.value.name}。你可以和我聊任何你想聊的话题，记得要健康哦！如果你想和其他伙伴沟通，可以点击对话框旁边的按钮切换伙伴哦！现在，开始我们愉快的聊天吧！`
      : `Hello, I'm ${friend.value.simulator}, your friend in AGI world. I'm driven by llm model ${_model.value.name}. Now you can talk with me about any topic. If you would like to chat with other guys, switch with button besides the input box. Now let's go!`,
    send: false,
    timestamp: Date.now(),
    displayName: friend.value.simulator,
    hint: true,
    avatar: friend.value.simulator_avatar_url,
    index: -1,
    audio: undefined as unknown as string,
    simulatorId: friend.value.id
  }]
}

const onSelectSimulatorClick = (_simulator: simulator._Simulator) => {
  if (friend.value.id === _simulator.id) {
    return
  }
  selectingSimulator.value = false
  initializeChat(_simulator)
}

const onSimulatorSelectorClose = () => {
  selectingSimulator.value = false
}

const onCancelSelectSimulatorClick = () => {
  selectingSimulator.value = false
}

const onSendClick = () => {
  displayMessages.value.push({
    message: message.value,
    send: true,
    timestamp: Date.now(),
    displayName: username.value,
    hint: false,
    avatar: userAvatar.value,
    index: -1,
    audio: undefined as unknown as string,
    simulatorId: -1
  })

  sendToFriend(message.value, nextRequestIndex.value++, friend.value.id)
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

const typing = () => {
  _typing(waitMessages.value, displayMessages.value, typingMessage.value, lastDisplayMessage.value, typingMessageIndex.value, audioPlayer.value, true, typingTicker.value, () => {
    lastDisplayMessage.value = undefined as unknown as Message
  }, typing, (_message: Message | undefined) => {
    return !_message || _message.simulatorId !== friend.value.id
  }).then((rc) => {
    if (!rc) return

    friendThinking.value = false

    if (rc.audioPlayer) audioPlayer.value = rc.audioPlayer
    if (rc.lastDisplayMessage) {
      lastDisplayMessage.value = rc.lastDisplayMessage
    }
    if (rc.typingInterval) {
      typingInterval.value = rc.typingInterval
      typingTicker.value = rc.typingTicker as number
    }
    if (rc.typingMessage) typingMessage.value = rc.typingMessage

    typingMessageIndex.value = rc.typingMessageIndex || typingMessageIndex.value
  }).catch((e) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed typing: ${e}`)
  })
}

const initializeChat = (_friend: simulator._Simulator) => {
  _model.value = dbBridge._Model.model(dbBridge._Model.chatModelId()) as model._Model
  friend.value = _friend
  friendThinking.value = false

  waitMessages.value = new Map<string, Message>()
  displayMessages.value = []
  typingMessageIndex.value = 0
  nextRequestIndex.value = 0
  lastDisplayMessage.value = undefined as unknown as Message
  typingMessage.value = undefined as unknown as Message

  if (audioPlayer.value) {
    audioPlayer.value.stop()
    audioPlayer.value = undefined as unknown as AudioPlayer
  }

  initializeMessage()
}

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
    simulator.Simulator.getSimulators(undefined, () => {
      initializeChat(dbBridge._Simulator.randomPeek(undefined))
    })
  })

  typingTicker.value = window.setInterval(typing, 100)
})

onBeforeUnmount(() => {
  if (typingTicker.value >= 0) {
    window.clearInterval(typingTicker.value)
    typingTicker.value = -1
  }
  if (audioPlayer.value) {
    audioPlayer.value.stop()
    audioPlayer.value = undefined as unknown as AudioPlayer
  }
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
