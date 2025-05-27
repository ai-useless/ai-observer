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
      <View v-for='(message, index) in displayMessages' :key='index' :style='{borderBottom : (index < displayMessages.length - 1 && !message.isTitle) ? "1px solid gray" : "", padding: message.isTitle ? "8px 0 4px 0" : "4px 0 8px 0"}'>
        <View v-if='message.isTitle' style='display: flex; padding-bottom: 8px; margin-bottom: 4px; line-height: 24px;'>
          <Image :src='modelLogo(message.modelId)' style='height: 24px; width: 24px; border-radius: 50%;' />
          <View style='font-weight: 400; color: lightgray; font-size: 12px;'>{{ modelName(message.modelId) }}</View>
        </View>
        <Image v-if='message.image' mode='widthFix' :src='message.image' style='width: 100%; margin-bottom: 4px;' />
        <View :style='{fontSize: message.isTitle ? "18px" : "12px", fontWeight: message.isTitle ? 600 : 400, textAlign: message.isTitle ? "center" : "left"}'>{{ message.message }}</View>
      </View>
      <View v-if='lastDisplayMessage' :style='{borderTop: lastDisplayMessage.isTitle ? "1px solid gray" : "", padding: lastDisplayMessage.isTitle ? "8px 0 4px 0" : "4px 0 8px 0"}'>
        <View v-if='lastDisplayMessage.isTitle' style='display: flex; padding-bottom: 8px; margin-bottom: 4px; line-height: 24px;'>
          <Image :src='modelLogo(lastDisplayMessage.modelId)' style='height: 24px; width: 24px; border-radius: 50%;' />
          <View style='font-weight: 400; color: lightgray; font-size: 12px;'>{{ modelName(lastDisplayMessage.modelId) }}</View>
        </View>
        <Image v-if='lastDisplayMessage.image' mode='widthFix' :src='lastDisplayMessage.image' style='width: 100%; margin-bottom: 4px;' />
        <View :style='{fontSize: lastDisplayMessage.isTitle ? "18px" : "12px", fontWeight: lastDisplayMessage.isTitle ? 600 : 400, textAlign: lastDisplayMessage.isTitle ? "center" : "left"}'>{{ lastDisplayMessage.message }}</View>
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
import Taro, { useDidHide } from '@tarojs/taro'
import { dbBridge, entityBridge } from 'src/bridge'
import { model, simulator } from 'src/localstores'
import { purify } from 'src/utils'
import { computed, onMounted, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { AudioPlayer } from 'src/player'
import { typing as _typing, Message as MessageBase } from 'src/typing'

import { gotoBottom, gotoTop, manualScrollGray, volumeOff, volumeUp, threeDotsVertical } from 'src/assets'

interface Message extends MessageBase {
  isTitle: boolean
  modelId: number
  image?: string
}

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
const generating = ref(true)
const images = ref(new Map<number, string>())

const modelLogo = (modelId: number) => {
  const model = models.value.find((el) => el.id === modelId)
  return model ? model.model_logo_url : ''
}

const modelName = (modelId: number) => {
  const model = models.value.find((el) => el.id === modelId)
  return model ? model.name : ''
}

const generate = async () => {
  generating.value = true

  nextTick().then(() => scrollTop.value += 1)

  for (const model of models.value) {
    const simulator = dbBridge._Simulator.randomPeek()
    const messages = [...displayMessages.value, ...Array.from(waitMessages.value.values())]
    await entityBridge.Duanzi.generate(messages.map((el) => el.message), model.id, simulator.id, (text: string, isTitle: boolean, index: number, audio?: string) => {
      generating.value = false

      waitMessages.value.set(`${text}-${index}`, {
        modelId: model.id,
        message: purify.purifyThink(text),
        isTitle,
        audio: audio || '',
        index,
        image: images.value.get(index),
        timestamp: Date.now()
      })

      images.value.delete(index)

      Taro.hideLoading()
    }, (index: number, image: string) => {
      const messages = [...displayMessages.value, ...(lastDisplayMessage.value ? [lastDisplayMessage.value] : []), ...(typingMessage.value ? [typingMessage.value] : []), ...Array.from(waitMessages.value.values())]
      const message = messages.find((el) => el.index === index)
      if (message) message.image = image
      else images.value.set(index, image)
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
    Taro.showLoading({
      title: `${models.value.length}个AGI正在创作！`
    })
    simulator.Simulator.getSimulators(undefined, async () => {
      await generate()
    })
  })

  if (Taro.getWindowInfo()) {
    duanziContentHeight.value = Taro.getWindowInfo().windowHeight - 4
  }

  typingTicker.value = window.setInterval(typing, 100)
})

onBeforeUnmount(() => {
  if (typingTicker.value >= 0) {
    window.clearInterval(typingTicker.value)
    typingTicker.value = -1
  }
  if (audioPlayer.value) {
    audioPlayer.value.context.stop()
    audioPlayer.value = undefined as unknown as AudioPlayer
  }
})

useDidHide(() => {
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
    lastDisplayMessage.value = undefined as unknown as Message
  }, typing, undefined, 20).then((rc) => {
    if (waitMessages.value.size <= 3 && displayMessages.value.length > 3) void generate()

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
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed typing: ${e}`)
  })
}

</script>
