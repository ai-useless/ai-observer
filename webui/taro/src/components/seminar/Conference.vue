<template>
  <View class='row'>
    <q-space />
    <View style='width: 100%; max-width: 960px; max-height: 100%;'>
      <View
        :style='{ height: chatBoxHeight + "px" }'
        ref='chatBox'
      >
        <View class='text-grey-9 text-left' style='font-size: 24px; font-weight: 600; padding: 32px 0 16px 0; transition: 500ms;'>
          {{ topic }}
        </View>
        <View class='row' style='transition: 500ms;'>
          <simulator-card v-if='host && host.simulator' :simulator='host.simulator' :small='false' :is-host='true' />
          <View class='flex justify-end items-end' style='margin-left: 24px;'>
            <simulator-card
              :style='{marginLeft: index === 0 ? "0" : "16px"}'
              v-for='(guest, index) in guests'
              :simulator='guest.simulator'
              :small='true'
              :key='index'
              :is-host='false'
            />
          </View>
        </View>
        <q-separator style='margin-top: 16px' />
        <View
          v-if='!displayMessages.length'
          style='margin-top: 16px; font-size: 20px'
          class='text-center text-grey-8'
        >
          <q-spinner-facebook class='text-red-4' size='128px' />
          <View>最靠谱的AGI观点栏目主持人正在准备台本，请大家耐心等待。</View>
        </View>
        <View v-else style='margin-top: 16px;'>
          <View v-for='(message, index) in displayMessages' :key='index'>
            <q-chat-message
              v-if='!message.subTopicTitle'
              :key='index'
              :name='message.simulator.name + " | " + message.participator.role + " | " + message.model.name'
              :avatar='message.simulator.avatar'
              :stamp='message.datetime'
              :text='[message.message]'
              text-color='grey-9'
              bg-color='grey-2'
            >
              <template #name>
                <View style='padding-bottom: 4px; line-height: 24px;' class='row'>
                  <View>
                    {{ message.simulator.name + " | " + message.participator.role + " | " + message.model.name }}
                  </View>
                  <q-img :src='message.model.authorLogo' width='24px' fit='contain' style='margin-left: 8px;' />
                  <q-img :src='message.model.vendorLogo' width='24px' fit='contain' style='margin-left: 8px;' />
                  <q-img :src='message.model.modelLogo' width='24px' fit='contain' style='margin-left: 8px;' />
                  <View> | {{ message.simulator.personality }}</View>
                </View>
              </template>
              <View v-html='message.message' style='line-height: 1.5em;' />
            </q-chat-message>
            <View v-else class='text-black text-bold text-center' style='font-size: 32px; margin: 64px 0'>
              {{ message.subTopic }}
            </View>
          </View>
          <q-resize-observer @resize='onChatBoxResize' />
        </View>
      </View>
    </View>
    <Outline v-if='outline' :json='outline' style='margin-left: 16px; margin-top: 160px;' :active-topic='activeTopic || ""' />
    <q-space />
  </View>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { seminar } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue'
import { timestamp2HumanReadable } from 'src/utils/timestamp'
import * as msgs from '../../i18n/zh-CN'
import { View } from '@tarojs/components'

import SimulatorCard from './SimulatorCard.vue'
import Outline from './Outline.vue'

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as entityBridge.PSimulator[])

const chatBox = ref<typeof View>()
const chatBoxHeight = ref(0)
const autoScroll = ref(true)

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

const displayMessages = ref([] as Message[])
const waitMessages = ref([] as Message[])
const typingMessage = ref(undefined as unknown as Message)
const typingIndex = ref(0)
const lastRound = ref(0)
const requesting = ref(false)
const eSeminar = ref(undefined as unknown as entityBridge.ESeminar)
const outline = ref(undefined as unknown as Record<string, unknown>)
const activeTopic = ref('')
const lastTopic = ref(undefined as unknown as string)
const audioPlayer = ref(undefined as unknown as HTMLAudioElement)

const typingInterval = ref(80)
const typingTicker = ref(-1)

const calculateTypingInterval = (duration: number) => {
  if (typingMessage.value.audio && typingMessage.value.audio.length && typingMessage.value.message && typingMessage.value.message.length) {
    const interval = Math.ceil(duration * 1000 / typingMessage.value.message.length)
    typingInterval.value = interval
  }
}

const typing = () => {
  if (!typingMessage.value && !waitMessages.value.length) return

  // If we have a message in typing, finish it
  if (typingMessage.value && typingIndex.value < typingMessage.value.message.length) {
    const matches = typingMessage.value.message.slice(typingIndex.value).match(/<[^>]+>/) || []
    const appendLen = matches[0] ? matches[0].length : 1
    displayMessages.value[displayMessages.value.length - 1].message = typingMessage.value.message.slice(0, typingIndex.value + appendLen)
    typingIndex.value += appendLen
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
    void eSeminar.value.nextGuests(_subTopic)
    requesting.value = true
  }

  if (typingMessage.value.audio && typingMessage.value.audio.length) {
    window.clearInterval(typingTicker.value)
    playAudio(typingMessage.value.audio).then((_audioPlayer) => {
      audioPlayer.value = _audioPlayer
      if (_audioPlayer.duration > 0) calculateTypingInterval(_audioPlayer.duration)
      typingTicker.value = window.setInterval(typing, typingInterval.value)
    }).catch((e) => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
}

const playAudio = async (base64Data: string) => {
  const cleanBase64 = base64Data.replace(/^data:audio\/\w+;base64,/, '')

  const byteCharacters = atob(cleanBase64)
  const byteArrays = new Uint8Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays[i] = byteCharacters.charCodeAt(i)
  }
  const blob = new Blob([byteArrays], { type: 'audio/mpeg' })
  const audioUrl = URL.createObjectURL(blob)
  const audioPlayer = new Audio(audioUrl)
  audioPlayer.loop = false
  await audioPlayer.play()
  return audioPlayer
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

watch(typingMessage, () => {
  if (!typingMessage.value.audio || !typingMessage.value.audio.length) return
  const audio = typingMessage.value.audio
  void playAudio(audio)
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
  outline.value = json
}

const onChatBoxResize = (size: { height: number }) => {
  if (autoScroll.value && chatBox.value) chatBox.value.setScrollPosition('vertical', size.height, 300)
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

  if (!_uid.value) return
  _seminar.value = await dbBridge._Seminar.seminar(_uid.value) as dbModel.Seminar

  eSeminar.value = new entityBridge.ESeminar(_seminar.value, onMessage, onThinking, onOutline, historyMessages)
  await eSeminar.value.start()

  typingTicker.value = window.setInterval(typing, 40)
})

onBeforeUnmount(() => {
  if (eSeminar.value) eSeminar.value.stop()
  if (typingTicker.value) window.clearInterval(typingTicker.value)
})
</script>

<style scoped lang='sass'>
::v-deep .q-markdown
  pre
    white-space: pre-wrap
    word-wrap: break-word
    background: none
</style>
