<template>
  <View>
    <scroll-view
      scrollY={true}
      :scroll-with-animation='true'
      :style='{ height: chatBoxHeight + "px" }'
      ref='chatBox'
      :scroll-top='scrollTop'
      showScrollbar={false}
      enhanced={true}
      showsVerticalScrollIndicator={false}
    >
      <View style='font-size: 24px; font-weight: 600; margin: 0 0 16px 0; transition: 500ms; border-bottom: 1px solid gray; width: calc(100% - 32px); padding-bottom: 4px;'>
        {{ topic }}
      </View>
      <View style='transition: 500ms'>
        <View v-if='host && host.simulator' style='font-size: 14px;'>
          <View style='width: 64px'>
            主持人：
          </View>
          <View style='color: blue'>
            {{ host.simulator.simulator }}
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
              {{ guest.simulator.simulator }}
            </Text>
          </View>
        </View>
      </View>
      <Outline :json='outline' :active-topic='activeTopic || ""' />
      <View style='margin-top: 16px;'>
        <View v-for='(message, index) in displayMessages' :key='index' style='width: 100%'>
          <MessageCard :message='message' />
        </View>
        <MessageCard v-if='lastDisplayMessage' :message='lastDisplayMessage' :key='displayMessages.length + 1' />
      </View>
      <View id='scrollBottomView'  />
    </scroll-view>
    <View style='display: flex; flex-direction: row-reverse; align-items: center; width: calc(100% - 32px); margin-top: -8px; height: 24px;'>
      <View style='display: flex; align-items: center; border: 1px solid gray; border-radius: 8px; height: 24px; background-color: rgba(160, 160, 160, 0.5);'>
        <View style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;'>
          <Image :src='gotoBottom' mode='widthFix' style='width: 24px; height: 24px;' />
        </View>
        <View style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;'>
          <Image :src='gotoTop' mode='widthFix' style='width: 24px; height: 24px;' />
        </View>
        <View :style='{ height: "24px", opacity: autoScroll ? 0.4 : 1, backgroundColor: "white" }' @click='onAutoScrollClick'>
          <Image :src='manualScrollGray' mode='widthFix' style='width: 24px; height: 24px;' />
        </View>
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { seminar, model, simulator } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { timestamp2HumanReadable } from 'src/utils/timestamp'
import { View, ScrollView, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { purify } from 'src/utils'
import { Message } from './Message'
import { seminarWorker } from 'src/worker'

import Outline from './Outline.vue'
import MessageCard from './MessageCard.vue'

import { gotoBottom, gotoTop, manualScrollGray } from 'src/assets'

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as entityBridge.PSimulator[])

const chatBox = ref<typeof View>()
const chatBoxHeight = ref(0)
const scrollTop = ref(999999)
const autoScroll = ref(true)

const topic = computed(() => _seminar.value ? _seminar.value.topic : undefined)
const hostParticipator = computed(() => participators.value.find((el) => el.role === dbModel.Role.HOST))
const host = computed(() => simulators.value.find((el) => hostParticipator.value && el.participatorId === hostParticipator.value.id))
const guests = computed(() => simulators.value.filter((el) => participators.value.find((_el) => _el.id === el.participatorId && _el.role === dbModel.Role.GUEST)))

const displayMessages = ref([] as Message[])
const loading = ref(false)
const messageCount = computed(() => displayMessages.value.length)
const waitMessages = ref([] as Message[])
const lastDisplayMessage = ref(undefined as unknown as Message)
const lastMessageText = computed(() => lastDisplayMessage.value ? lastDisplayMessage.value.message : undefined)
const typingMessage = ref(undefined as unknown as Message)
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
  playing: boolean
  duration: number
  durationTicker: number
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

watch(lastMessageText, async () => {
  if (!autoScroll.value) return
  await nextTick()
  scrollTop.value += 1
})

const onAutoScrollClick = () => {
  autoScroll.value = !autoScroll.value
}

const calculateTypingInterval = (duration: number) => {
  if (typingMessage.value.audio && typingMessage.value.audio.length && typingMessage.value.message && typingMessage.value.message.length) {
    const interval = Math.ceil(duration * 1000 / purify.purifyText(typingMessage.value.message).length)
    typingInterval.value = interval
  }
}

const typing = () => {
  if (!typingMessage.value && !waitMessages.value.length) return

  // If we have a message in typing, finish it
  if (typingMessage.value && lastDisplayMessage.value && lastDisplayMessage.value.message.length < typingMessage.value.message.length) {
    if (lastDisplayMessage.value.message.length > 0 && audioPlayer.value && !audioPlayer.value.playing) {
      lastDisplayMessage.value.message = typingMessage.value.message
      return
    }
    const matches = typingMessage.value.message.slice(lastDisplayMessage.value.message.length).match(/^<[^>]+>/) || []
    const appendLen = matches[0] ? matches[0].length + 1 : 1
    lastDisplayMessage.value.message = typingMessage.value.message.slice(0, lastDisplayMessage.value.message.length + appendLen)
    return
  }

  if (lastDisplayMessage.value) {
    displayMessages.value.push(lastDisplayMessage.value)
    lastDisplayMessage.value = undefined as unknown as Message
  }
  displayMessages.value.forEach((el) => {
    el.datetime = timestamp2HumanReadable(el.timestamp)
  })

  if (!waitMessages.value.length) return
  // If audio is still playing, do nothing
  if (audioPlayer.value && audioPlayer.value.playing) return

  typingMessage.value = waitMessages.value[0]
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

  lastDisplayMessage.value = {
    ...typingMessage.value,
    message: ''
  }
}

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

const strip = (html: string): string => {
  return  html
    .replace(/<!DOCTYPE html[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .replace(/<head[^>]*>/gi, '')
    .replace(/<\/head>/gi, '')
    .trim()
}

const onMessage = async (seminarUid: string, subTopic: string, participatorId: number, message: string, round: number, audio: string) => {
  if (seminarUid !== _uid.value) return

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
    message: strip(purify.purifyThink(message)),
    participator,
    simulator: dbBridge._Simulator.simulator(participator.simulatorId) as simulator._Simulator,
    model: dbBridge._Model.model(participator.modelId) as model._Model,
    timestamp: Date.now(),
    datetime: timestamp,
    audio,
    subTopicTitle: false,
    subTopic
  })

  waitMessages.value = waitMessages.value.map((el) => {
    const timestamp = timestamp2HumanReadable(el.timestamp)
    return { ...el, datetime: timestamp }
  })
}

const onThinking = (participatorId: number) => {
  seminar.Seminar.startThink(participatorId)
}

const onOutline = (json: Record<string, unknown>) => {
  Taro.setNavigationBarTitle({
    title: json.topic as string
  })
  outline.value = json
}

const historyMessages = (): Map<string, seminarWorker.HistoryMessage[]> => {
  const messages = new Map<string, seminarWorker.HistoryMessage[]>()

  displayMessages.value.slice(0, displayMessages.value.length - 1).filter((el) => el.message.length && !el.subTopicTitle && el.subTopic === lastTopic.value).forEach((el) => {
    const _messages = messages.get(el.subTopic) || []
    _messages.push({
      participatorId: el.participator.id as number,
      content: el.simulator.simulator + ' 的观点: ' + purify.purifyText(el.message)
    })
    messages.set(el.subTopic, _messages)
  })
  waitMessages.value.filter((el) => el.subTopic === lastTopic.value).forEach((el) => {
    const _messages = messages.get(el.subTopic) || []
    _messages.push({
      participatorId: el.participator.id as number,
      content: purify.purifyText(el.message)
    })
    messages.set(el.subTopic, _messages)
  })

  return messages
}

const startSeminar = async () => {
  displayMessages.value = []
  waitMessages.value = []
  typingMessage.value = undefined as unknown as Message
  lastDisplayMessage.value = undefined as unknown as Message
  lastRound.value = 0
  outline.value = {
    titles: []
  }

  if (typingTicker.value >= 0) window.clearInterval(typingTicker.value)
  typingTicker.value = -1

  if (!_uid.value) return

  if (audioPlayer.value) audioPlayer.value.context.stop()

  Taro.showLoading({
    title: '主持人正在准备台本'
  })

  _seminar.value = dbBridge._Seminar.seminar(_uid.value) as dbModel.Seminar

  eSeminar.value = new entityBridge.ESeminar(_seminar.value, onMessage, onThinking, onOutline, historyMessages)
  loading.value = true
  eSeminar.value.start()

  typingTicker.value = window.setInterval(typing, 100)
}

watch(_uid, () => {
  startSeminar()
})

onMounted(async () => {
  if (Taro.getWindowInfo()) {
    chatBoxHeight.value = Taro.getWindowInfo().windowHeight - 20
  }
  startSeminar()
})

onBeforeUnmount(() => {
  if (eSeminar.value) eSeminar.value.stop()
  if (typingTicker.value) window.clearInterval(typingTicker.value)
})
</script>

<style>
</style>
