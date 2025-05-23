<template>
  <View>
    <View :style='{height: stageHeight + "px"}'>
      <Image :src='backgroundImage' style='width: 100%;' mode='widthFix' />
      <View style='margin-top: -168px; background-color: rgba(128, 128, 128, 0.8); opacity: 0.8; padding: 8px 32px; text-align: center;'>
        <View style='font-size: 16px; font-weight: 600; color: white; padding: 0 0 4px 0; min-height: 18px; max-height: 18px; overflow: scroll;'>{{ topic }}</View>
        <View style='display: flex; padding: 8px 0 0 0; color: white; justify-content: center; align-items: center;'>
          <View v-if='host && host.simulator' style='font-size: 14px;'>
            <Image :src='host.simulator.simulator_avatar_url' style='width: 32px; height: 32px; border-radius: 50%;' />
            <View style='margin-left: 4px; color: white;'>
              {{ host.simulator.simulator }}
            </View>
          </View>
          <View style='font-size: 14px; display: flex; margin-left: 16px;'>
            <View style='margin-left: 8px;  color: white; display: flex; flex-wrap: wrap;'>
              <View v-for='(guest, index) in guests' :key='index' style='color: white; margin-left: 8px; margin-bottom: 4px;'>
                <Image v-if='guests.length' :src='guest.simulator.simulator_avatar_url' style='width: 32px; height: 32px; border-radius: 50%;' />
                <View style='margin-left: 4px;'>
                  {{ guest.simulator.simulator }}
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
    <View style='padding: 16px 16px; width: calc(100% - 32px); background: linear-gradient(0deg, #040B12 0%, #0A243B 45%, #144663 80%, #1E5A7E 100%);'>
      <scroll-view
        scrollY={true}
        :scroll-with-animation='true'
        :style='{ height: chatBoxHeight + "px", width: "100%" }'
        :scroll-top='scrollTop'
        showScrollbar={false}
        enhanced={true}
        showsVerticalScrollIndicator={false}
      >
        <View style='font-size: 24px; font-weight: 600; margin: 0 0 16px 0; transition: 500ms; border-bottom: 1px solid gray; width: 100%; padding-bottom: 4px; color: white;'>
          {{ topic }}
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
      <View style='display: flex; flex-direction: row-reverse; align-items: center; width: 100%; margin-top: -8px; height: 24px;'>
        <View style='display: flex; align-items: center; border: 1px solid gray; border-radius: 8px; height: 24px; background-color: rgba(160, 160, 160, 0.5);'>
          <View style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onGotoBottomClick'>
            <Image :src='gotoBottom' mode='widthFix' style='width: 24px; height: 24px;' />
          </View>
          <View style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onGotoTopClick'>
            <Image :src='gotoTop' mode='widthFix' style='width: 24px; height: 24px;' />
          </View>
          <View :style='{borderRight: "1px solid gray", height: "24px", opacity: autoScroll ? 0.4 : 1, backgroundColor: "white" }' @click='onAutoScrollClick'>
            <Image :src='manualScrollGray' mode='widthFix' style='width: 24px; height: 24px;' />
          </View>
          <View style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onContentListClick'>
            <Image :src='list' mode='widthFix' style='width: 24px; height: 24px;' />
          </View>
          <View style='height: 24px; opacity: 0.4; background-color: white;' @click='onPlayClick'>
            <Image :src='enablePlay ? volumeUp : volumeOff' mode='widthFix' style='width: 24px; height: 24px;' />
          </View>
        </View>
      </View>
    </View>
  </View>
  <AtModal :is-opened='showContentList' @close='onContentListClose'>
    <AtModalHeader>目录</AtModalHeader>
    <AtModalContent>
      <View>
        <Outline :active-topic='activeTopic || ""' :json='outline' />
      </View>
    </AtModalContent>
    <AtModalAction>
      <Button @click='onContentListClose'>关闭</Button>
    </AtModalAction>
  </AtModal>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { seminar, model, simulator } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { AtModal, AtModalHeader, AtModalContent, AtModalAction } from 'taro-ui-vue3'
import { timestamp2HumanReadable } from 'src/utils/timestamp'
import { View, ScrollView, Button, Image } from '@tarojs/components'
import Taro, { useDidHide, useDidShow } from '@tarojs/taro'
import { purify } from 'src/utils'
import { Message } from './Message'
import { seminarWorker } from 'src/worker'
import { AudioPlayer } from 'src/player'
import { typing as _typing } from 'src/typing'

import Outline from './Outline.vue'
import MessageCard from './MessageCard.vue'

import { gotoBottom, gotoTop, manualScrollGray, volumeOff, volumeUp, list } from 'src/assets'

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as entityBridge.PSimulator[])

const stageHeight = ref(0)
const chatBoxHeight = ref(0)
const scrollTop = ref(999999)
const autoScroll = ref(true)
const enablePlay = ref(true)
const showContentList = ref(false)

const backgroundImage = ref('http://106.15.6.50:81/download/images/yuanzhuotaolun.png')

const topic = computed(() => _seminar.value ? _seminar.value.topic : undefined)
const hostParticipator = computed(() => participators.value.find((el) => el.role === dbModel.Role.HOST))
const host = computed(() => simulators.value.find((el) => hostParticipator.value && el.participatorId === hostParticipator.value.id))
const guests = computed(() => simulators.value.filter((el) => participators.value.find((_el) => _el.id === el.participatorId && _el.role === dbModel.Role.GUEST)))

const displayMessages = ref([] as Message[])
const loading = ref(false)
const messageCount = computed(() => displayMessages.value.length)
const waitMessages = ref(new Map<string, Message>())
const lastWaitMessage = ref(undefined as unknown as Message)
const typingMessageIndex = ref(0)
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
const titles = computed(() => outline.value.titles as string[])

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

const onGotoBottomClick = () => {
  autoScroll.value = true
  scrollTop.value = 999999
}

const onGotoTopClick = () => {
  autoScroll.value = false
  scrollTop.value = 0
}

const onPlayClick = () => {
  enablePlay.value = !enablePlay.value
}

const onContentListClose = () => {
  showContentList.value = false
}

const onContentListClick = () => {
  if (!titles.value || !titles.value.length) return
  showContentList.value = true
}

const typing = () => {
  _typing(waitMessages.value, displayMessages.value, typingMessage.value, lastDisplayMessage.value, typingMessageIndex.value, audioPlayer.value, true, typingTicker.value, () => {
    lastDisplayMessage.value = undefined as unknown as Message
  }, typing).then((rc) => {
    if (typingMessage.value?.round >= lastRound.value - 1 && !requesting.value && eSeminar.value.shouldNext()) {
      requesting.value = true
      setTimeout(() => {
        void eSeminar.value.nextGuests(lastTopic.value || lastWaitMessage.value?.subTopic || typingMessage.value.subTopic, enablePlay.value)
      }, 100)
    }

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

    if (typingMessage.value) {
      seminar.Seminar.speak(typingMessage.value.participator.id as number)
      if (typingMessage.value?.subTopic !== activeTopic.value) {
        displayMessages.value.push({
          ...typingMessage.value,
          index: typingMessage.value.index - 1,
          subTopicTitle: true
        })
        activeTopic.value = typingMessage.value?.subTopic
      }
    }
  }).catch((e) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed typing: ${e}`)
  })
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

const onMessage = async (seminarUid: string, subTopic: string, participatorId: number, message: string, round: number, audio: string, index: number) => {
  if (seminarUid !== _uid.value) return

  seminar.Seminar.stopThink(participatorId)

  const participator = dbBridge._Participator.participator(participatorId) as dbModel.Participator
  const timestamp = timestamp2HumanReadable(Date.now())

  requesting.value = false

  // Discard topic after conclude: order here is important
  const messages = [...(typingMessage.value ? [typingMessage.value] : []), ...displayMessages.value, ...Array.from(waitMessages.value.values())]
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

  const key = `${subTopic}-${participatorId}-${round}-${index}`

  waitMessages.value.set(key, {
    round,
    message: purify.purifyThink(message),
    participator,
    simulator: dbBridge._Simulator.simulator(participator.simulatorId) as simulator._Simulator,
    model: dbBridge._Model.model(participator.modelId) as model._Model,
    timestamp: Date.now(),
    datetime: timestamp,
    audio,
    subTopicTitle: false,
    subTopic,
    index
  })
  lastWaitMessage.value = waitMessages.value.get(key) as Message
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
  const maxTokens = 32768
  let tokens = 0

  Array.from(waitMessages.value.values()).filter((el) => el.subTopic === lastTopic.value).forEach((el) => {
    const _messages = messages.get(el.subTopic) || []
    const content = el.simulator.simulator + ' 的观点: ' + purify.purifyText(el.message)
    _messages.push({
      participatorId: el.participator.id as number,
      content
    })
    tokens += content.length
    messages.set(el.subTopic, _messages)
  })

  for (let i = displayMessages.value.length - 2; i >= 0; i--) {
    const el = displayMessages.value[i]
    const content = el.simulator.simulator + ' 的观点: ' + purify.purifyText(el.message)

    tokens += content.length
    if (tokens > maxTokens) break

    const _messages = messages.get(el.subTopic) || []

    _messages.splice(0, 0, {
      participatorId: el.participator.id as number,
      content: content
    })
    messages.set(el.subTopic, _messages)
  }

  return messages
}

const startSeminar = async () => {
  displayMessages.value = []
  waitMessages.value = new Map<string, Message>()
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

  eSeminar.value.generateStageBackground().then((image) => {
    backgroundImage.value = image as string
  })
  eSeminar.value.start()

  typingTicker.value = window.setInterval(typing, 100)
}

watch(_uid, () => {
  startSeminar()
})

onMounted(async () => {
  Taro.setNavigationBarTitle({
    title: 'AGI观点'
  })

  if (Taro.getWindowInfo()) {
    stageHeight.value = Taro.getWindowInfo().windowWidth
    chatBoxHeight.value = Taro.getWindowInfo().windowHeight - stageHeight.value - 40
  }
})

useDidShow(() => {
  _seminar.value = dbBridge._Seminar.seminar(_uid.value) as dbModel.Seminar

  const participators = dbBridge._Participator.participators(_uid.value)
  if (!topic.value || !_uid.value || !participators.length) {
    Taro.navigateTo({ url: '/pages/seminar/guest/GuestsPage' })
    return
  }
  startSeminar()
})

useDidHide(() => {
  if (eSeminar.value) eSeminar.value.stop()
  if (typingTicker.value) {
    window.clearInterval(typingTicker.value)
    typingTicker.value = -1
  }
})
</script>

<style>
</style>
