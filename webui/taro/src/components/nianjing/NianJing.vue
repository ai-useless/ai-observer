<template>
  <View>
    <View :style='{ height: scriptHeight + "px", width: "100vw" }'>
      <View style='font-size: 18px; font-weight: 600; border-bottom: 1px solid lightgray; margin: 8px 16px; color: gray; text-align: center; height: 32px;'>{{ prompt }}</View>
      <Image
        src='http://106.15.6.50:81/download/images/qiaomuyu.gif'
        mode='widthFix'
        style='width: 100vw; height: 400px;'
      />
      <View v-if='generating' :style='{ height: scrollHeight + "px", padding: "0 16px", display: "flex", justifyContent: "center", alignItems: "center" }'>
        <Button class='plain-btn' style='font-size: 14px; color: gray;' plain :loading='true'>师傅正在准备，请稍后...</Button>
      </View>
      <scroll-view
        v-else
        scrollY={true}
        :scroll-with-animation='true'
        :style='{ height: scrollHeight + "px", padding: "0 16px 8px 16px", width: "calc(100% - 32px)" }'
        :scroll-top='scrollTop'
        showScrollbar={false}
        enhanced={true}
        showsVerticalScrollIndicator={false}
      >
        <View v-for='(message, index) in displayMessages' :key='index' :style='{borderTop: index > 0 ? "1px solid lightgray" : "", padding: "8px 0", textAlign: "center", marginBottom: "4px"}'>
          <View style='font-size: 14px; color: gray'>{{ message.message }}</View>
        </View>
        <View v-if='lastDisplayMessage' style='padding: 8px 0; text-align: center; border-top: 1px solid lightgray; margin-bottom: 4px;'>
          <View style='font-size: 14px; color: gray;'>{{ lastDisplayMessage.message }}</View>
        </View>
      </scroll-view>
    </View>
    <View style='display: flex; padding: 0 16px;'>
      <ComplexInput v-model:prompt='prompt' v-model:audio-input='audioInput' v-model:height='inputHeight' placeholder='听一段经文，让心静下来~'>
        <template #actions>
          <View style='display: flex;'>
            <View style='height: 24px; width: 24px; padding: 3px 0; margin-left: 4px; margin-right: -4px;' @click='onGenerateClick'>
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
  <AtModal :is-opened='selectingSimulator' @close='onSimulatorSelectorClose'>
    <AtModalHeader>选择模拟器</AtModalHeader>
    <AtModalContent>
      <View>
        <View v-for='(_simulator, index) in simulators' :key='index' style='border-bottom: 1px solid gray;' @click='onSelectSimulatorClick(_simulator)'>
          <SimulatorCard :simulator='_simulator' />
        </View>
      </View>
    </AtModalContent>
    <AtModalAction>
      <Button @click='onCancelSelectSimulatorClick'>取消</Button>
    </AtModalAction>
  </AtModal>
</template>

<script setup lang='ts'>
import { View, Image, Button } from '@tarojs/components'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AtModal, AtModalHeader, AtModalContent, AtModalAction } from 'taro-ui-vue3'
import { dbBridge, entityBridge } from 'src/bridge'
import Taro from '@tarojs/taro'
import { model, simulator } from 'src/localstores'
import { purify } from 'src/utils'

import ComplexInput from '../input/ComplexInput.vue'
import SimulatorCard from '../simulator/SimulatorCard.vue'

import { send, personAvatar } from 'src/assets'

const prompt = ref('般若波罗密心经')

const audioInput = ref(false)
const audioError = ref('')

const inputHeight = ref(0)
const scriptHeight = ref(0)
const scrollHeight = ref(0)
const scrollTop = ref(999999)

interface Message {
  message: string
  audio?: string
  index: number
  first: boolean
  last: boolean
}

const displayMessages = ref([] as Message[])
const waitMessages = ref([] as Message[])
const lastDisplayMessage = ref(undefined as unknown as Message)
const typingMessage = ref(undefined as unknown as Message)
const typingMessageIndex = ref(0)
const typingTicker = ref(-1)
const typingInterval = ref(40)

const messageCount = computed(() => waitMessages.value.length)

const generating = ref(false)

const speaker = ref(undefined as unknown as simulator._Simulator)
const _model = ref(undefined as unknown as model._Model)

const simulators = computed(() => simulator.Simulator.allSimulators())
const selectingSimulator = ref(false)

watch(scriptHeight, () => {
  scrollHeight.value = scriptHeight.value - 400 - 32
})

watch(messageCount, async () => {
  await nextTick()
  scrollTop.value += 1
})

const generate = () => {
  generating.value = true

  displayMessages.value = []
  waitMessages.value = []
  lastDisplayMessage.value = undefined as unknown as Message
  typingMessage.value = undefined as unknown as Message
  if (audioPlayer.value && audioPlayer.value.context) audioPlayer.value.context.stop()
  audioPlayer.value = undefined as unknown as AudioPlayer

  entityBridge.ENianJing.request(prompt.value, speaker.value.id, _model.value.id, (message: string, index: number, first: boolean, last: boolean, audio?: string) => {
    generating.value = false
    waitMessages.value.push({
      message,
      audio,
      index,
      first,
      last
    })
  })
}

watch(prompt, () => {
  if (!audioInput.value || !prompt.value || !prompt.value.length) return

  generate()
  prompt.value = ''
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

  audioError.value = ''
})

const onGenerateClick = () => {
  generate()
}

watch(inputHeight, () => {
  if (Taro.getWindowInfo()) {
    scriptHeight.value = Taro.getWindowInfo().windowHeight - 32 - inputHeight.value
  }
})

const onOpenSelectSimulatorClick = () => {
  selectingSimulator.value = true
}

const onSelectSimulatorClick = (_simulator: simulator._Simulator) => {
  speaker.value = _simulator
  selectingSimulator.value = false
}

const onSimulatorSelectorClose = () => {
  selectingSimulator.value = false
}

const onCancelSelectSimulatorClick = () => {
  selectingSimulator.value = false
}

const calculateTypingInterval = (duration: number) => {
  if (typingMessage.value.audio && typingMessage.value.audio.length && typingMessage.value.message && typingMessage.value.message.length) {
    const interval = Math.ceil(duration * 1000 / purify.purifyText(typingMessage.value.message).length)
    typingInterval.value = interval
  }
}

onMounted(async () => {
  Taro.setNavigationBarTitle({
    title: 'AGI妙音坊'
  })
  if (Taro.getWindowInfo()) {
    scriptHeight.value = Taro.getWindowInfo().windowHeight - 32
  }
  model.Model.getModels(() => {
    _model.value = dbBridge._Model.model(dbBridge._Model.topicModelId()) as model._Model
    simulator.Simulator.getSimulators(undefined, () => {
      speaker.value = dbBridge._Simulator.randomPeek()
    })
  })

  typingTicker.value = window.setInterval(typing, typingInterval.value)

  bgPlayer.value = await playAudio('http://106.15.6.50:81/download/mp3/qiaomuyu.mp3', true) as AudioPlayer

  generate()
})

onBeforeUnmount(() => {
  if (typingTicker.value >= 0) {
    window.clearInterval(typingTicker.value)
  }
  if (bgPlayer.value && bgPlayer.value.context) {
    bgPlayer.value.context.stop()
  }
})

class AudioPlayer {
  context: Taro.InnerAudioContext
  playing: boolean
  duration: number
  durationTicker: number
}

const audioPlayer = ref(undefined as unknown as AudioPlayer)
const bgPlayer = ref(undefined as unknown as AudioPlayer)

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

  if (!waitMessages.value.length) return
  // If audio is still playing, do nothing
  if (audioPlayer.value && audioPlayer.value.playing) return

  const index = waitMessages.value.findIndex((el) => el.index === typingMessageIndex.value)
  if (index < 0) return

  typingMessage.value = waitMessages.value[index]
  waitMessages.value = [...waitMessages.value.slice(0, index), ...waitMessages.value.slice(index + 1)]
  typingMessageIndex.value += 1

  if (typingMessage.value.last) {
    waitMessages.value = [...displayMessages.value, typingMessage.value]
    typingMessageIndex.value = 0
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

const playAudio = (audioUrl: string, loop?: boolean): Promise<AudioPlayer | undefined> => {
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
      if (loop) {
        context.seek(0)
        context.stop()
        context.play()
      }
    })
  })
}

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
