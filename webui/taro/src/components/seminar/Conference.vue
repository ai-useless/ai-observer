<template>
  <View style='padding: 8px'>
    <scroll-view
      :scroll-y='true'
      :scroll-with-animation='true'
      :style='{ height: chatBoxHeight + "px" }'
      ref='chatBox'
      :scroll-into-view='scrollIntoView'
    >
      <View style='font-size: 24px; font-weight: 600; margin: 0 0 16px 0; transition: 500ms; border-bottom: 1px solid gray;'>
        {{ topic }}
      </View>
      <View style='transition: 500ms'>
        <View v-if='host && host.simulator' style='font-size: 14px;'>
          <View style='width: 64px'>
            主持人：
          </View>
          <View style='color: blue'>
            {{ host.simulator.name }}
          </View>
        </View>
        <View style='font-size: 14px;'>
          <View style='width: 64px'>
            嘉宾：
          </View>
          <View style='display: flex; flex-wrap: wrap; justify-content: left; align-items: start; color: blue'>
            <Text
              style='margin-right: 16px;'
              v-for='(guest, index) in guests'
              :simulator='guest.simulator'
              :small='true'
              :key='index'
              :is-host='false'
            >
              {{ guest.simulator.name }}
            </Text>
          </View>
        </View>
      </View>
      <Outline :json='outline' :active-topic='activeTopic || ""' />
      <View style='margin-top: 16px;'>
        <View v-for='(message, index) in displayMessages' :key='index' :id='messageViewId(index === displayMessages.length - 1 ? typingMessage : message)'>
          <View
            v-if='!message.subTopicTitle'
            :key='index'
            :name='message.simulator.name + " | " + message.participator.role + " | " + message.model.name'
            :avatar='message.simulator.avatar'
            :stamp='message.datetime'
            :text='[message.message]'
            text-color='grey-9'
            bg-color='grey-2'
          >
            <View style='padding-bottom: 4px; line-height: 24px; border-bottom: 1px solid gray; border-top: 1px solid gray; margin-top: 8px; padding-top: 4px;'>
              <View style='display: flex;'>
                <Image :src='message.simulator.avatar' mode='widthFix' style='width: 24px; border-radius: 50%;' />
                <View style='color: blue; font-weight: 600; margin-left: 8px;'>{{ message.simulator.name }}</View>
                <View style='margin-left: 4px;'>{{ message.participator.role }}</View>
                <Image :src='message.model.authorLogo' mode='widthFix' style='margin-left: 8px; width: 24px;' />
                <Image :src='message.model.vendorLogo' mode='widthFix' style='margin-left: 8px; width: 24px;' />
                <Image :src='message.model.modelLogo' mode='widthFix' style='margin-left: 8px; width: 24px;' />
              </View>
              <View style='font-size: 12px; color: gray;'>{{ message.simulator.personality }}</View>
              <View style='font-size: 12px; color: gray;'>
                {{ message.model.name }}
              </View>
            </View>
            <rich-text :nodes='message.message' user-select style='font-size: 14px; margin-top: 16px;' />
          </View>
          <View v-else style='font-size: 24px; margin: 24px 0; font-weight: 600;'>
            {{ message.subTopic }}
          </View>
        </View>
      </View>
    </scroll-view>
  </View>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { seminar } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { timestamp2HumanReadable } from 'src/utils/timestamp'
import * as msgs from '../../i18n/zh-CN'
import { Image, View, ScrollView, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import CryptoJS from 'crypto-js'

import Outline from './Outline.vue'

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as entityBridge.PSimulator[])

const chatBox = ref<typeof View>()
const chatBoxHeight = ref(0)
const scrollIntoView = ref('')

const topic = computed(() => _seminar.value ? _seminar.value.topic : undefined)
const hostParticipator = computed(() => participators.value.find((el) => el.role === dbModel.Role.HOST))
const host = computed(() => simulators.value.find((el) => hostParticipator.value && el.participatorId === hostParticipator.value.id))
const guests = computed(() => simulators.value.filter((el) => participators.value.find((_el) => _el.id === el.participatorId && _el.role === dbModel.Role.GUEST)))

interface Message {
  round: number
  message: string
  participator: dbModel.Participator
  simulator: dbModel.Simulator
  model: dbModel.Model
  datetime: string
  timestamp: number
  audio: string
  subTopicTitle: boolean
  subTopic: string
}

const messageViewId = (message: Message) => {
  return 'a' + CryptoJS.SHA256(message.message).toString()
}

const displayMessages = ref([] as Message[])
const loading = ref(true)
const messageCount = computed(() => displayMessages.value.length)
const waitMessages = ref([] as Message[])
const typingMessage = ref(undefined as unknown as Message)
const typingIndex = ref(0)
const lastRound = ref(0)
const requesting = ref(false)
const eSeminar = ref(undefined as unknown as entityBridge.ESeminar)
const outline = ref({
  titles: []
} as unknown as Record<string, unknown>)
const activeTopic = ref('')
const lastTopic = ref(undefined as unknown as string)

class AudioPlayer {
  context: Taro.InnerAudioContext
  ended: boolean
  playing: boolean
  duration: number
}

const audioPlayer = ref(undefined as unknown as AudioPlayer)

const typingInterval = ref(80)
const typingTicker = ref(-1)

watch(messageCount, () => {
  if (messageCount.value && loading.value) {
    Taro.hideLoading()
    loading.value = false
  }
})

const calculateTypingInterval = (duration: number) => {
  if (typingMessage.value.audio && typingMessage.value.audio.length && typingMessage.value.message && typingMessage.value.message.length) {
    const interval = Math.ceil(duration * 1000 / typingMessage.value.message.length)
    typingInterval.value = interval
  }
}

const scrollToBottom = () => {
  scrollIntoView.value = ''
  setTimeout(() => {
    scrollIntoView.value = messageViewId(typingMessage.value)
  }, 100)
}

const typing = () => {
  if (!typingMessage.value && !waitMessages.value.length) return

  // If we have a message in typing, finish it
  if (typingMessage.value && typingIndex.value < typingMessage.value.message.length) {
    const matches = typingMessage.value.message.slice(typingIndex.value).match(/<[^>]+>/) || []
    const appendLen = matches[0] ? matches[0].length : 1
    displayMessages.value[displayMessages.value.length - 1].message = typingMessage.value.message.slice(0, typingIndex.value + appendLen)
    typingIndex.value += appendLen
    scrollToBottom()
    return
  }

  if (!waitMessages.value.length) return
  // If audio is still playing, do nothing
  if (audioPlayer.value && !audioPlayer.value.ended) return

  typingMessage.value = waitMessages.value[0]
  typingIndex.value = 0
  waitMessages.value = waitMessages.value.slice(1)

  seminar.Seminar.speak(typingMessage.value.participator.id as number)
  if (typingMessage.value.subTopic !== activeTopic.value) {
    displayMessages.value.push({
      ...typingMessage.value,
      subTopicTitle: true
    })
    activeTopic.value = typingMessage.value.subTopic
  }

  if (typingMessage.value.round >= lastRound.value - 1 && !requesting.value && eSeminar.value.shouldNext()) {
    let _subTopic = lastTopic.value
    if (!_subTopic && waitMessages.value[waitMessages.value.length - 1]) {
      _subTopic = waitMessages.value[waitMessages.value.length - 1].subTopic
    }
    if (!_subTopic && typingMessage.value.subTopic) {
      _subTopic = typingMessage.value.subTopic
    }
    setTimeout(() => {
      void eSeminar.value.nextGuests(_subTopic)
    }, 100)
    requesting.value = true
  }

  if (typingMessage.value.audio && typingMessage.value.audio.length) {
    window.clearInterval(typingTicker.value)
    playAudio(typingMessage.value.audio).then((player: AudioPlayer) => {
      if (player && player.duration > 0) {
        calculateTypingInterval(player.duration)
        audioPlayer.value = player
        typingTicker.value = window.setInterval(typing, typingInterval.value)
      }
    }).catch((e) => {
      console.log(`Failed play audio: ${e}`)
      typingTicker.value = window.setInterval(typing, typingInterval.value)
    })
  }

  displayMessages.value.forEach((el) => {
    const timestamp = timestamp2HumanReadable(el.timestamp)
    el.datetime = msgs.default[timestamp.msg](timestamp.value)
  })

  displayMessages.value.push({
    ...typingMessage.value,
    message: ''
  })

  scrollToBottom()
}

const playAudio = (base64Data: string): Promise<AudioPlayer | undefined> => {
  const cleanBase64 = base64Data.replace(/^data:audio\/\w+;base64,/, '')
  const fileCid = CryptoJS.SHA256(cleanBase64).toString()
  const filePath = `${Taro.env.USER_DATA_PATH}/${fileCid}.mp3`
  const fs = Taro.getFileSystemManager()

  try {
    fs.writeFileSync(filePath, cleanBase64)
  } catch(e) {
    return Promise.reject(`Failed write file: ${e}`)
  }
  const context = Taro.createInnerAudioContext()
  context.src = filePath

  const player = {
    context: context,
    ended: false,
    duration: context.duration
  } as AudioPlayer

  context.onEnded(() => {
    fs.removeSavedFile({filePath})
    player.ended = true
  })

  return new Promise((resolve, reject) => {
    context.onError((e) => {
      fs.removeSavedFile({filePath})
      player.ended = true
      reject(`Failed play audio: ${JSON.stringify(e)}`)
    })
    context.onCanplay(() => {
      context.play()
      player.playing = true
      player.duration = context.duration
      resolve(player)
    })
  })
}

watch(_uid, () => {
  if (!_uid.value) return
  _seminar.value = dbBridge._Seminar.seminar(_uid.value) as dbModel.Seminar
})

watch(_seminar, () => {
  participators.value = dbBridge._Participator.participators(_seminar.value.uid)
})

watch(participators, () => {
  simulators.value = entityBridge.EParticipator.simulators(participators.value)
})

const onMessage = async (subTopic: string, participatorId: number, message: string, round: number, audio: string) => {
  seminar.Seminar.stopThink(participatorId)

  const participator = dbBridge._Participator.participator(participatorId) as dbModel.Participator
  const timestamp = timestamp2HumanReadable(Date.now())

  requesting.value = false

  // Discard topic after conclude: order here is important
  const messages = [...(typingMessage.value ? [typingMessage.value] : []), ...displayMessages.value, ...waitMessages.value]
  if (
    messages.length &&
    messages[messages.length - 1].subTopic !== subTopic &&
    messages.findIndex((el) => el.subTopic === subTopic) >= 0
  ) {
    console.log('Discard message', subTopic, message)
    return
  }

  lastRound.value = round
  lastTopic.value = subTopic

  waitMessages.value.push({
    round,
    message,
    participator,
    simulator: dbBridge._Simulator.simulator(participator.simulatorId) as dbModel.Simulator,
    model: dbBridge._Model.model(participator.modelId) as dbModel.Model,
    timestamp: Date.now(),
    datetime: msgs.default[timestamp.msg](timestamp.value),
    audio,
    subTopicTitle: false,
    subTopic
  })

  waitMessages.value = waitMessages.value.map((el) => {
    const timestamp = timestamp2HumanReadable(el.timestamp)
    return { ...el, datetime: msgs.default[timestamp.msg](timestamp.value) }
  })
}

const onThinking = (participatorId: number) => {
  seminar.Seminar.startThink(participatorId)
}

const onOutline = (json: Record<string, unknown>) => {
  console.log(json)
  outline.value = json
}

const historyMessages = (): Map<string, string[]> => {
  const messages = new Map<string, string[]>()

  displayMessages.value.slice(0, displayMessages.value.length - 1).filter((el) => el.message.length && !el.subTopicTitle).forEach((el) => {
    const _messages = messages.get(el.subTopic) || []
    _messages.push(el.simulator.name + ' 的观点 ' + el.message)
    messages.set(el.subTopic, _messages)
  })
  waitMessages.value.forEach((el) => {
    const _messages = messages.get(el.subTopic) || []
    _messages.push(el.message)
    messages.set(el.subTopic, _messages)
  })

  return messages
}

onMounted(async () => {
  chatBoxHeight.value = window.innerHeight - 106
  Taro.showLoading({
    title: '主持人正在准备台本'
  })

  if (!_uid.value) return
  _seminar.value = dbBridge._Seminar.seminar(_uid.value) as dbModel.Seminar

  eSeminar.value = new entityBridge.ESeminar(_seminar.value, onMessage, onThinking, onOutline, historyMessages)
  await eSeminar.value.start()

  typingTicker.value = window.setInterval(typing, 40)
})

onBeforeUnmount(() => {
  if (eSeminar.value) eSeminar.value.stop()
  if (typingTicker.value) window.clearInterval(typingTicker.value)
})
</script>

<style>
</style>
