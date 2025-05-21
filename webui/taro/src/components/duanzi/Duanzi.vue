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
        <View :style='{fontSize: message.isTitle ? "18px" : "12px", fontWeight: message.isTitle ? 600 : 400, textAlign: message.isTitle ? "center" : "left"}'>{{ message.text }}</View>
      </View>
      <View v-if='lastDisplayMessage' :style='{borderTop: lastDisplayMessage.isTitle ? "1px solid gray" : "", padding: lastDisplayMessage.isTitle ? "8px 0 4px 0" : "4px 0 8px 0"}'>
        <View v-if='lastDisplayMessage.isTitle' style='display: flex; padding-bottom: 8px; margin-bottom: 4px; line-height: 24px;'>
          <Image :src='modelLogo(lastDisplayMessage.modelId)' style='height: 24px; width: 24px; border-radius: 50%;' />
          <View style='font-weight: 400; color: lightgray; font-size: 12px;'>{{ modelName(lastDisplayMessage.modelId) }}</View>
        </View>
        <Image v-if='lastDisplayMessage.image' mode='widthFix' :src='lastDisplayMessage.image' style='width: 100%; margin-bottom: 4px;' />
        <View :style='{fontSize: lastDisplayMessage.isTitle ? "18px" : "12px", fontWeight: lastDisplayMessage.isTitle ? 600 : 400, textAlign: lastDisplayMessage.isTitle ? "center" : "left"}'>{{ lastDisplayMessage.text }}</View>
      </View>
    </scroll-view>
    <View style='display: flex; flex-direction: row-reverse; align-items: center; width: 100%; height: 24px;'>
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

import { gotoBottom, gotoTop, manualScrollGray, volumeOff, volumeUp, threeDotsVertical } from 'src/assets'

interface Message {
  text: string
  isTitle: boolean
  audio: string
  modelId: number
  index: number
  image?: string
}

const models = computed(() => model.Model.models())

const displayMessages = ref([] as Message[])
const waitMessages = ref([] as Message[])
const lastDisplayMessage = ref(undefined as unknown as Message)
const lastMessageText = computed(() => lastDisplayMessage.value ? lastDisplayMessage.value.text : undefined)
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
    const messages = [...displayMessages.value, ...waitMessages.value]
    await entityBridge.Duanzi.generate(messages.map((el) => el.text), model.id, simulator.id, (text: string, isTitle: boolean, index: number, audio?: string) => {
      generating.value = false

      waitMessages.value.push({
        modelId: model.id,
        text: purify.purifyThink(text),
        isTitle,
        audio: audio || '',
        index,
        image: images.value.get(index)
      })

      images.value.delete(index)

      Taro.hideLoading()
    }, (index: number, image: string) => {
      const messages = [...displayMessages.value, ...(lastDisplayMessage.value ? [lastDisplayMessage.value] : []), ...(typingMessage.value ? [typingMessage.value] : []), ...waitMessages.value]
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
    duanziContentHeight.value = Taro.getWindowInfo().windowHeight - 32
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

class AudioPlayer {
  context: Taro.InnerAudioContext
  playing: boolean
  duration: number
  durationTicker: number
}

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

const calculateTypingInterval = (duration: number) => {
  if (typingMessage.value.audio && typingMessage.value.audio.length && typingMessage.value.text && typingMessage.value.text.length) {
    const interval = Math.ceil(duration * 1000 / purify.purifyText(typingMessage.value.text).length)
    typingInterval.value = interval
  }
}

const typing = () => {
  if (!typingMessage.value && !waitMessages.value.length) return

  // If we have a message in typing, finish it
  if (typingMessage.value && lastDisplayMessage.value && lastDisplayMessage.value.text.length < typingMessage.value.text.length) {
    if (lastDisplayMessage.value.text.length > 0 && audioPlayer.value && !audioPlayer.value.playing) {
      lastDisplayMessage.value.text = typingMessage.value.text
      return
    }
    const matches = typingMessage.value.text.slice(lastDisplayMessage.value.text.length).match(/^<[^>]+>/) || []
    const appendLen = matches[0] ? matches[0].length + 1 : 1
    lastDisplayMessage.value.text = typingMessage.value.text.slice(0, lastDisplayMessage.value.text.length + appendLen)
    return
  }

  if (lastDisplayMessage.value) {
    displayMessages.value.push(lastDisplayMessage.value)
    lastDisplayMessage.value = undefined as unknown as Message
  }

  if (!waitMessages.value.length) return
  // If audio is still playing, do nothing
  if (audioPlayer.value && audioPlayer.value.playing) return

  const index = waitMessages.value.findIndex((el) => el.index === typingMessageIndex.value)
  if (index < 0) return

  typingMessage.value = waitMessages.value[index]
  waitMessages.value = [...waitMessages.value.slice(0, index), ...waitMessages.value.slice(index + 1)]
  typingMessageIndex.value += 1

  lastModelId.value = typingMessage.value.modelId

  if (waitMessages.value.length <= 3 && displayMessages.value.length > 3) void generate()

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
    text: ''
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

</script>
