<template>
  <q-page>
    <div :style='{width: "100%", height: `${contentHeight}px`}' class='flex justify-center items-center'>
      <q-resize-observer @resize='onWindowResize' />
      <div style='height: 100%; width: 600px; max-width: 100%;' class='bg-grey-2'>
        <div class='full-width q-py-sm text-bold text-grey-9 flex justify-center items-center'>
          <q-avatar size='36px'>
            <q-img :src='friend?.simulator_avatar_url' />
          </q-avatar>
          <div class='q-ml-sm'>{{ friend?.simulator }} | {{ _model?.name }}</div>
          <q-btn
            v-if='showSelectingFriend'
            flat
            dense
            color='light-blue'
            class='q-ml-xs'
            @click='selectingFriend = !selectingFriend'
          >
            换人
          </q-btn>
        </div>
        <q-separator />
        <q-scroll-area
          style='height: calc(100% - 56px - 32px - 8px); width: 100%; padding: 8px 16px;'
          ref='chatBox'
          :bar-style='{ width: "2px" }'
          :thumb-style='{ width: "2px" }'
          class='cursor-pointer'
        >
          <div style='font-size: 16px;'>
            <q-resize-observer @resize='onChatBoxResize' />
            <div v-for='(_message, index) in displayMessages' :key='index'>
              <MessageCard :message='_message' />
            </div>
            <MessageCard v-if='lastDisplayMessage' :message='lastDisplayMessage' />
            <div class='full-width flex justify-center items-center'>
              <q-btn
                flat
                dense
                v-if='friendThinking'
                :loading='true'
                color='grey-6'
                class='full-width'
              >
                <template #loading>
                  <div class='row full-width flex justify-center items-center'>
                    <q-spinner-dots size='20px' class='q-mr-sm' />
                    对方正在思考...
                  </div>
                </template>
              </q-btn>
            </div>
          </div>
        </q-scroll-area>
        <div class='flex justify-center items-center'>
          <BottomFixInput
            v-model='message'
            placeholder='随便聊点儿啥~'
            @enter='onMessageEnter'
            style='width: 540px; max-width: calc(100% - 8px);'
          />
        </div>
      </div>
      <div v-if='!showSelectingFriend' class='full-height q-pt-lg'>
        <RightBottomSimulatorList @selected='onSimulatorSelected' />
      </div>
    </div>
    <q-dialog v-model='logining' persistent>
      <WechatLogin @cancel='onCancelLogin' />
    </q-dialog>
    <q-dialog v-if='showSelectingFriend' v-model='selectingFriend'>
      <SimulatorList
        v-model:selected='friend'
        @selected='onSimulatorSelected'
      />
    </q-dialog>
  </q-page>
</template>

<script setup lang='ts'>
import { computed, onMounted, ref, toRef, watch, defineProps } from 'vue'
import { model, setting, simulator, user } from 'src/localstores'
import { dbBridge, entityBridge } from 'src/bridge'
import { AudioPlayer } from 'src/player'
import { useRouter } from 'vue-router'
import { Platform, QScrollArea } from 'quasar'
import { typing as _typing, Message as MessageBase } from 'src/typing'

import BottomFixInput from '../input/BottomFixInput.vue'
import RightBottomSimulatorList from '../list/RightBottomSimulatorList.vue'
import WechatLogin from '../login/WechatLogin.vue'
import SimulatorList from '../list/SimulatorList.vue'
import MessageCard from './MessageCard.vue'

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
}

const contentHeight = computed(() => setting.Setting.contentHeight())

const chatBox = ref<QScrollArea>()

const message = ref('')
const audioError = ref('')

const displayMessages = ref([] as Message[])
const nextRequestIndex = ref(0)
const waitMessages = ref(new Map<string, Message>())
const lastDisplayMessage = ref(undefined as unknown as Message)
const typingMessage = ref(undefined as unknown as Message)
const typingMessageIndex = ref(0)
const friend = ref(undefined as unknown as simulator._Simulator)
const _model = ref(undefined as unknown as model._Model)

const userAvatar = computed(() => user.User.avatarUrl())
const username = computed(() => user.User.username())

const audioInput = ref(false)

const friendThinking = ref(false)
const logining = ref(false)
const selectingFriend = ref(false)
const windowWidth = ref(0)
const showSelectingFriend = computed(() => Platform.is.mobile || windowWidth.value < 1280)

const audioPlayer = ref(undefined as unknown as AudioPlayer)
const typingInterval = ref(80)
const typingTicker = ref(-1)

const router = useRouter()

const sendToFriend = (_message: string, requestIndex: number) => {
  friendThinking.value = true

  const messages = [...displayMessages.value, ...(typingMessage.value ? [typingMessage.value] : []), ...Array.from(waitMessages.value.values())]

  entityBridge.EChat.chat(friend.value.id, friend.value.simulator, friend.value.origin_personality, username.value, [...messages.map((el) => `${el.send ? friend.value.simulator : username.value}: ${el.message}`), _message], _model.value.id, language.value || '中文', (_message?: string, audio?: string, error?: string) => {
    friendThinking.value = false
    if (error && error.length) {
      waitMessages.value.set(`${error}-${requestIndex}`, {
        message: error,
        send: false,
        timestamp: Date.now(),
        displayName: friend.value.simulator,
        hint: true,
        avatar: friend.value.simulator_avatar_url,
        index: requestIndex,
        audio: undefined as unknown as string
      })
      return
    }
    waitMessages.value.set(`${_message}-${requestIndex}`, {
      message: _message as string,
      send: false,
      timestamp: Date.now(),
      displayName: friend.value.simulator,
      hint: false,
      avatar: friend.value.simulator_avatar_url,
      index: requestIndex,
      audio: audio as unknown as string
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
    audio: undefined as unknown as string
  })

  sendToFriend(message.value, nextRequestIndex.value++)
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
    audio: undefined as unknown as string
  })

  audioError.value = ''
})

const onMessageEnter = (_message: string) => {
  displayMessages.value.push({
    message: _message,
    send: true,
    timestamp: Date.now(),
    displayName: username.value,
    hint: false,
    avatar: userAvatar.value,
    index: -1,
    audio: undefined as unknown as string
  })

  sendToFriend(message.value, nextRequestIndex.value++)
  message.value = ''
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
    audio: undefined as unknown as string
  }]
}

const typing = () => {
  _typing(waitMessages.value, displayMessages.value, typingMessage.value, lastDisplayMessage.value, typingMessageIndex.value, audioPlayer.value, true, typingTicker.value, () => {
    lastDisplayMessage.value = undefined as unknown as Message
  }, typing).then((rc) => {
    if (!rc) return

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

const initializeChat = async () => {
  _model.value = await dbBridge._Model.model(await dbBridge._Model.chatModelId()) as model._Model
  friend.value = await dbBridge._Simulator.randomPeek(undefined)
  initializeMessage()
}

onMounted(() => {
  setting.Setting.setCurrentMenu(language.value === '中文' ? 'chat' : 'english')

  if (!userAvatar.value || !userAvatar.value.length || !username.value || !username.value.length) {
    user.User.getUser(undefined, (error: boolean) => {
      if (error) {
        logining.value = true
      }
    })
  }

  model.Model.getModels(() => {
    simulator.Simulator.getSimulators(undefined, () => {
      void initializeChat()
    })
  })

  typingTicker.value = window.setInterval(typing, 100)
})

const onSimulatorSelected = (_simulator: simulator._Simulator) => {
  selectingFriend.value = false
  friend.value = _simulator
  initializeMessage()
}

const onCancelLogin = () => {
  logining.value = false
  void router.push({ path: '/' })
}

const onWindowResize = (size: { width: number }) => {
  windowWidth.value = size.width
}

const onChatBoxResize = (size: { height: number }) => {
  chatBox.value?.setScrollPosition('vertical', size.height, 300)
}

</script>

<style lang='sass'>
</style>
