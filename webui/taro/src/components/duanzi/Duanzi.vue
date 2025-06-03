<template>
  <View>
    <scroll-view
      scrollY={true}
      :style='{ height: duanziContentHeight + "px" }'
      :scroll-top='scrollTop'
      showScrollbar={false}
      enhanced={true}
      showsVerticalScrollIndicator={false}
      :scroll-with-animation='true'
    >
      <View v-for='(message, index) in displayMessages' :key='index' :style='{borderBottom : index < displayMessages.length - 1 ? "1px solid gray" : ""}'>
        <MessageCard :message='message' />
      </View>
      <View v-if='lastDisplayMessage' :style='{borderTop: displayMessages.length > 0 ? "1px solid gray" : ""}'>
        <MessageCard :message='lastDisplayMessage' />
      </View>
    </scroll-view>
    <View style='display: flex; flex-direction: row-reverse; align-items: center; width: 100%; height: 24px; margin-top: -24px;'>
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
        <View style='border-right: 1px solid gray; height: 24px; opacity: 0.4; background-color: white;' @click='onPlayClick'>
          <Image :src='enablePlay ? volumeUp : volumeOff' mode='widthFix' style='width: 24px; height: 24px;' />
        </View>
        <View style='height: 24px; opacity: 0.4; background-color: white;' @click='onMoreClick'>
          <Image :src='threeDotsVertical' mode='widthFix' style='width: 24px; height: 24px;' />
        </View>
      </View>
      <View v-if='generating' style='text-align: center; font-size: 12px; padding: 4px 0 4px 0; color: lightgray; height: 18px; margin-right: 16px;'>
        {{ models.length }}个AGI正在创作 ...
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidHide, useDidShow } from '@tarojs/taro'
import { dbBridge, entityBridge } from 'src/bridge'
import { model, simulator } from 'src/localstores'
import { purify } from 'src/utils'
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { AudioPlayer } from 'src/player'
import { typing as _typing } from 'src/typing'
import { Message } from './Message'

import MessageCard from './MessageCard.vue'

import { gotoBottom, gotoTop, manualScrollGray, volumeOff, volumeUp, threeDotsVertical } from 'src/assets'

const models = computed(() => model.Model.models())

const displayMessages = ref([] as Message[])
const waitMessages = ref(new Map<string, Message>())
const lastDisplayMessage = ref(undefined as unknown as Message)
const lastMessageText = computed(() => lastDisplayMessage.value ? lastDisplayMessage.value.message : undefined)
const typingMessage = ref(undefined as unknown as Message)
const typingMessageIndex = ref(0)
const lastModelId = ref(-1 as unknown as number)

const duanziContentHeight = ref(0)
const scrollTop = ref(999999)
const generating = ref(false)
const nextDuanziIndex = ref(0)

const eDuanzi = ref(undefined as unknown as entityBridge.Duanzi)

const images = ref(new Map<string, string>())

watch(generating, () => {
  if (generating.value) {
    Taro.showLoading({
      title: `${models.value.length}个AGI正在创作！`
    })
  } else {
    Taro.hideLoading()
  }
})

const generate = async () => {
  generating.value = true

  nextTick().then(() => scrollTop.value += 1)

  for (const model of models.value) {
    if (!eDuanzi.value) return

    const simulator = dbBridge._Simulator.randomPeek()
    const messages = [...displayMessages.value, ...Array.from(waitMessages.value.values())]
    await eDuanzi.value.generate(messages.map((el) => el.message), model.id, simulator.id, (title: string, content: string, audio?: string, messageUid?: string) => {
      generating.value = false

      const contentIndex = nextDuanziIndex.value++

      waitMessages.value.set(`${content}-${contentIndex}`, {
        title,
        modelId: model.id,
        message: purify.purifyThink(content),
        audio: audio as string,
        index: contentIndex,
        image: images.value.get(messageUid as string),
        timestamp: Date.now(),
        messageUid: messageUid as string
      })

      images.value.delete(messageUid as string)
    }, (messageUid: string, image: string) => {
      const messages = [...displayMessages.value, ...(lastDisplayMessage.value ? [lastDisplayMessage.value] : []), ...(typingMessage.value ? [typingMessage.value] : []), ...Array.from(waitMessages.value.values())]
      const message = messages.find((el) => el.messageUid === messageUid)
      if (message) message.image = image
      else images.value.set(messageUid, image)
    }, true)
  }
}

const onMoreClick = async () => {
  if (generating.value) return
  await generate()
}

onMounted(async () => {
  Taro.setNavigationBarTitle({
    title: 'AGI有内涵'
  })

  model.Model.getModels(() => {
    simulator.Simulator.getSimulators(undefined, async () => {
      await generate()
    })
  })

  if (Taro.getWindowInfo()) {
    duanziContentHeight.value = Taro.getWindowInfo().windowHeight - 4
  }
})

useDidShow(() => {
  eDuanzi.value = new entityBridge.Duanzi()
  typingTicker.value = window.setInterval(typing, 100)
})

useDidHide(() => {
  if (eDuanzi.value) {
    eDuanzi.value.stop()
    eDuanzi.value = undefined as unknown as entityBridge.Duanzi
  }
  if (typingTicker.value >= 0) {
    window.clearInterval(typingTicker.value)
    typingTicker.value = -1
  }
  if (audioPlayer.value) {
    audioPlayer.value.context.stop()
    audioPlayer.value = undefined as unknown as AudioPlayer
  }
})

const audioPlayer = ref(undefined as unknown as AudioPlayer)

const typingInterval = ref(80)
const typingTicker = ref(-1)
const autoScroll = ref(true)
const enablePlay = ref(true)

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

const typing = () => {
  _typing(waitMessages.value, displayMessages.value, typingMessage.value, lastDisplayMessage.value, typingMessageIndex.value, audioPlayer.value, enablePlay.value, typingTicker.value, () => {
    if (enablePlay.value)
      void AudioPlayer.play('https://api.meipu-agi.cn/downloads/laugh.mp3')
    lastDisplayMessage.value = undefined as unknown as Message
  }, typing, undefined, 20).then((rc) => {
    if (waitMessages.value.size <= 3 && displayMessages.value.length > 3) {
      void generate()
      if (!eDuanzi.value) {
        if (rc && rc.typingInterval) {
          window.clearInterval(rc.typingTicker)
        }
        return
      }
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

    if (typingMessage.value) lastModelId.value = typingMessage.value.modelId
  }).catch((e) => {
    generating.value = false
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed typing: ${e}`)
  })
}

</script>
