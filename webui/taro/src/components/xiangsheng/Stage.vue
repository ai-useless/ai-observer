<template>
  <View>
    <View :style='{height: stageHeight + "px"}'>
      <Image :src='backgroundImage' style='width: 100%;' mode='widthFix' />
      <View style='margin-top: -120px;'>
        <View style='font-size: 16px; font-weight: 600; color: white; background-color: rgba(128, 128, 128, 0.3); padding: 0 32px; height: 36px;'>{{ currentTopic }}</View>
        <View style='width: 100%; display: flex; padding: 8px 0; background-color: rgba(128, 128, 128, 0.3); padding: 8px 32px; color: white;'>
          <View v-if='host && host.simulator' style='font-size: 14px; display: flex;'>
            <Image :src='host.simulator.simulator_avatar_url' style='width: 32px; height: 32px; border-radius: 50%;' />
            <View style='margin-left: 8px;'>
              <View style='width: 64px'>
                逗哏：
              </View>
              <View style='color: white'>
                {{ host.simulator.simulator }}
              </View>
            </View>
          </View>
          <View style='font-size: 14px; display: flex;'>
            <Image v-if='guests.length' :src='guests[0].simulator.simulator_avatar_url' style='width: 32px; height: 32px; border-radius: 50%;' />
            <View style='margin-left: 8px;'>
              <View style='width: 64px'>
                捧哏：
              </View>
              <View style='display: flex; flex-wrap: wrap; justify-content: left; align-items: start; color: white'>
                <Text
                  style='margin-right: 16px;'
                  v-for='(guest, index) in guests'
                  :key='index'
                >
                  {{ guest.simulator.simulator }}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
    <View style='padding: 0 16px'>
      <scroll-view
        scrollY={true}
        :scroll-with-animation='true'
        :style='{ height: chatBoxHeight + "px" }'
        :scroll-top='scrollTop'
        showScrollbar={false}
        enhanced={true}
        showsVerticalScrollIndicator={false}
      >
        <View style='margin-top: 16px;'>
          <View v-for='(message, index) in displayMessages' :key='index' style='width: 100%'>
            <MessageCard :message='message' />
          </View>
          <MessageCard v-if='lastDisplayMessage' :message='lastDisplayMessage' :key='displayMessages.length + 1' />
        </View>
        <View id='scrollBottomView'  />
      </scroll-view>
      <View style='display: flex; flex-direction: row-reverse; align-items: center; width: 100%; height: 24px;'>
        <View style='display: flex; align-items: center; border: 1px solid gray; border-radius: 8px; height: 24px; background-color: rgba(160, 160, 160, 0.5);'>
          <View :style='{borderRight: "1px solid gray", height: "24px", opacity: editing ? 1 : 0.4, backgroundColor: "white" }' @click='onEditTopicClick'>
            <Image :src='editing ? arrowForward : editSquare' mode='widthFix' style='width: 24px; height: 24px;' />
          </View>
          <View style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onGotoBottomClick'>
            <Image :src='gotoBottom' mode='widthFix' style='width: 24px; height: 24px;' />
          </View>
          <View style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onGotoTopClick'>
            <Image :src='gotoTop' mode='widthFix' style='width: 24px; height: 24px;' />
          </View>
          <View :style='{borderRight: "1px solid gray", height: "24px", opacity: autoScroll ? 0.4 : 1, backgroundColor: "white" }' @click='onAutoScrollClick'>
            <Image :src='manualScrollGray' mode='widthFix' style='width: 24px; height: 24px;' />
          </View>
          <View :style='{borderRight: "1px solid gray", height: "24px", opacity: playScripts ? 1 : 0.4, backgroundColor: "white" }' @click='onPlayScriptsClick'>
            <Image :src='dominoMask' mode='widthFix' style='width: 24px; height: 24px;' />
          </View>
          <View style='height: 24px; opacity: 0.4; background-color: white;' @click='onPlayClick'>
            <Image :src='enablePlay ? volumeUp : volumeOff' mode='widthFix' style='width: 24px; height: 24px;' />
          </View>
        </View>
        <Input
          v-if='editing'
          :value='topic'
          @input='onTopicInput'
          style='font-size: 14px; height: 18px; border: 1px solid gray; border-radius: 4px; padding: 0 8px; margin-right: 8px; background-color: rgba(160, 160, 160, 0.5);'
        />
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { xiangsheng, model, simulator } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { timestamp2HumanReadable } from 'src/utils/timestamp'
import { View, ScrollView, Text, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { purify } from 'src/utils'
import { Message } from './Message'

import MessageCard from './MessageCard.vue'

import { gotoBottom, gotoTop, manualScrollGray, volumeOff, volumeUp, editSquare, arrowForward, dominoMask } from 'src/assets'
import { xiangshengWorker } from 'src/worker'

const _uid = computed(() => xiangsheng.Xiangsheng.xiangsheng())
const _xiangsheng = ref(undefined as unknown as dbModel.Xiangsheng)
const backgroundImage = ref(undefined as unknown as string)
const participators = ref([] as dbModel.Participator[])
const simulators = ref([] as entityBridge.PSimulator[])

const chatBoxHeight = ref(0)
const stageHeight = ref(0)
const scrollTop = ref(999999)
const autoScroll = ref(true)
const enablePlay = ref(true)
const playScripts = ref(false)

const hostParticipator = computed(() => participators.value.find((el) => el.role === dbModel.Role.HOST))
const host = computed(() => simulators.value.find((el) => hostParticipator.value && el.participatorId === hostParticipator.value.id))
const guests = computed(() => simulators.value.filter((el) => participators.value.find((_el) => _el.id === el.participatorId && _el.role === dbModel.Role.GUEST)))

const topic = computed(() => xiangsheng.Xiangsheng.topic())
const editing = ref(false)

const onTopicInput = (e: { detail: { value: string } }) => {
  xiangsheng.Xiangsheng.setTopic(e.detail.value)
}

const displayMessages = ref([] as Message[])
const loading = ref(false)
const messageCount = computed(() => displayMessages.value.length + waitMessages.value.length + (lastDisplayMessage.value ? 1 : 0))
const waitMessages = ref([] as Message[])
const lastDisplayMessage = ref(undefined as unknown as Message)
const lastMessageText = computed(() => lastDisplayMessage.value ? lastDisplayMessage.value.message : undefined)
const typingMessage = ref(undefined as unknown as Message)
const eXiangsheng = ref(undefined as unknown as entityBridge.EXiangsheng)
const typingMessageIndex = ref(0)
const currentTopic = ref(undefined as unknown as string)

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

const onPlayScriptsClick = () => {
  playScripts.value = !playScripts.value
  _xiangsheng.value.intent = playScripts.value ? xiangshengWorker.Intent.CLASSIC_SCRIPTS : xiangshengWorker.Intent.GENERATE
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

const onEditTopicClick = () => {
  editing.value = !editing.value
  xiangsheng.Xiangsheng.setTopic(topic.value)
  if (topic.value !== _xiangsheng.value.topic) {
    eXiangsheng.value.changeTopic(topic.value)
  }
  Taro.setNavigationBarTitle({
    title: topic.value
  })
  _xiangsheng.value.topic = topic.value
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
    lastDisplayMessage.value.typing = false
    displayMessages.value.push(lastDisplayMessage.value)
    lastDisplayMessage.value = undefined as unknown as Message
  }
  displayMessages.value.forEach((el) => {
    el.datetime = timestamp2HumanReadable(el.timestamp)
  })

  if (!waitMessages.value.length) return
  // If audio is still playing, do nothing
  if (audioPlayer.value && audioPlayer.value.playing) return

  const index = waitMessages.value.findIndex((el) => el.index === typingMessageIndex.value && (!currentTopic.value || el.topic === currentTopic.value || el.first))
  if (index < 0) return
  typingMessage.value = waitMessages.value[index]

  if (typingMessageIndex.value === 0 && typingMessage.value.first) currentTopic.value = typingMessage.value.topic

  waitMessages.value = [...waitMessages.value.slice(0, index), ...waitMessages.value.slice(index + 1, waitMessages.value.length)]

  if (waitMessages.value.length < 10 && waitMessages.value.findIndex((el) => el.last) >= 0 && autoScroll.value) {
    if (playScripts.value) eXiangsheng.value.startScripts()
    else eXiangsheng.value.start()
  }

  typingMessageIndex.value += 1
  if (typingMessage.value.last) typingMessageIndex.value = 0

  if (typingMessage.value.audio && typingMessage.value.audio.length && enablePlay.value) {
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
    message: '',
    typing: true
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
  _xiangsheng.value = dbBridge._Xiangsheng.xiangsheng(_uid.value) as dbModel.Xiangsheng
})

watch(_xiangsheng, () => {
  participators.value = dbBridge._Participator.participators(_xiangsheng.value.uid)
})

watch(participators, () => {
  simulators.value = entityBridge.EParticipator.simulators(participators.value)
})

const onMessage = async (topic: string, participatorId: number, text: string, audio: string, index: number, first: boolean, last: boolean) => {
  const participator = dbBridge._Participator.participator(participatorId) as dbModel.Participator
  const timestamp = timestamp2HumanReadable(Date.now())

  waitMessages.value.push({
    topic,
    message: purify.purifyThink(text),
    participator,
    simulator: dbBridge._Simulator.simulator(participator.simulatorId) as simulator._Simulator,
    model: dbBridge._Model.model(participator.modelId) as model._Model,
    timestamp: Date.now(),
    datetime: timestamp,
    audio,
    index,
    first,
    last,
    typing: false
  })

  waitMessages.value = waitMessages.value.map((el) => {
    const timestamp = timestamp2HumanReadable(el.timestamp)
    return { ...el, datetime: timestamp }
  })
}

const startXiangsheng = async () => {
  displayMessages.value = []
  waitMessages.value = []
  typingMessage.value = undefined as unknown as Message
  lastDisplayMessage.value = undefined as unknown as Message

  if (typingTicker.value >= 0) window.clearInterval(typingTicker.value)
  typingTicker.value = -1

  if (!_uid.value) return

  if (audioPlayer.value) audioPlayer.value.context.stop()

  Taro.showLoading({
    title: '演员正在候场'
  })

  _xiangsheng.value = dbBridge._Xiangsheng.xiangsheng(_uid.value) as dbModel.Xiangsheng
  playScripts.value = _xiangsheng.value.intent === xiangshengWorker.Intent.CLASSIC_SCRIPTS

  eXiangsheng.value = new entityBridge.EXiangsheng(_xiangsheng.value, onMessage)
  loading.value = true

  if (playScripts.value) eXiangsheng.value.startScripts()
  else eXiangsheng.value.start()

  backgroundImage.value = await eXiangsheng.value.generateStageBackground() as string

  typingTicker.value = window.setInterval(typing, 100)
}

watch(_uid, () => {
  startXiangsheng()
})

onMounted(async () => {
  Taro.setNavigationBarTitle({
    title: 'AGI相声社'
  })

  if (Taro.getWindowInfo()) {
    stageHeight.value = Taro.getWindowInfo().windowWidth
    chatBoxHeight.value = Taro.getWindowInfo().windowHeight - stageHeight.value - 32
  }

  const participators = dbBridge._Participator.participators(_uid.value)
  if (!topic.value || !_uid.value || !participators.length) {
    Taro.navigateTo({ url: '/pages/xiangsheng/role/RolesPage' })
    return
  }

  Taro.setNavigationBarTitle({
    title: topic.value
  })
  startXiangsheng()
})

onBeforeUnmount(() => {
  if (eXiangsheng.value) eXiangsheng.value.stop()
  if (typingTicker.value) window.clearInterval(typingTicker.value)
})
</script>

<style>
</style>
