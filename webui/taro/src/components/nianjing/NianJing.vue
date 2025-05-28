<template>
  <View>
    <View :style='{ height: scriptHeight + "px", width: "100vw" }'>
      <View style='display: flex; justify-content: center; align-items: center; border-bottom: 1px solid lightgray; height: 36px; padding-bottom: 4px;'>
        <Image v-if='speaker' :src='speaker.simulator_avatar_url' mode='widthFix' style='width: 32px; height: 32px; border-radius: 50%;' />
        <View v-if='speaker' style='margin-left: 4px;'>{{ speaker.simulator }}</View>
        <View style='margin-left: 4px; font-size: 12px; color: gray;'>念诵</View>
        <View style='font-size: 18px; font-weight: 600; margin-left: 4px; text-align: center;'>{{ prompt }}</View>
      </View>
      <Image
        src='http://8.133.205.39:81/download/images/qiaomuyu.gif'
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
        <View v-for='(message, index) in displayMessages.filter((el) => el.name === prompt)' :key='index' :style='{borderTop: index > 0 ? "1px solid lightgray" : "", padding: "8px 0", textAlign: "center", marginBottom: "4px"}'>
          <View style='font-size: 14px; color: gray'>{{ message.message }}</View>
        </View>
        <View v-if='lastDisplayMessage' style='padding: 8px 0; text-align: center; border-top: 1px solid lightgray; margin-bottom: 4px;'>
          <View style='font-size: 14px; color: gray;'>{{ lastDisplayMessage.message }}</View>
        </View>
      </scroll-view>
    </View>
    <View style='display: flex; padding: 0 16px;'>
      <ComplexInput v-model:prompt='inputPrompt' v-model:audio-input='audioInput' v-model:height='inputHeight' placeholder='听一段经文，让心静下来~'>
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
import { AudioPlayer } from 'src/player'
import { typing as _typing, Message as MessageBase } from 'src/typing'

import ComplexInput from '../input/ComplexInput.vue'
import SimulatorCard from '../simulator/SimulatorCard.vue'

import { send, personAvatar } from 'src/assets'

const prompt = ref('般若波罗密心经')
const inputPrompt = ref(prompt.value)

const audioInput = ref(false)
const audioError = ref('')

const inputHeight = ref(0)
const scriptHeight = ref(0)
const scrollHeight = ref(0)
const scrollTop = ref(999999)

interface Message extends MessageBase {
  name: string
  first: boolean
  last: boolean
  simulatorId: number
}

const displayMessages = ref([] as Message[])
const waitMessages = ref(new Map<string, Message>())
const lastDisplayMessage = ref(undefined as unknown as Message)
const typingMessage = ref(undefined as unknown as Message)
const typingMessageIndex = ref(0)
const typingTicker = ref(-1)
const typingInterval = ref(40)

const messageCount = computed(() => waitMessages.value.size)

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

const generate = (_prompt: string, simulatorId: number) => {
  if (!_prompt.length && simulatorId === speaker.value.id) return

  generating.value = true

  displayMessages.value = []
  waitMessages.value = new Map<string, Message>()
  lastDisplayMessage.value = undefined as unknown as Message
  typingMessage.value = undefined as unknown as Message
  typingMessageIndex.value = 0

  if (audioPlayer.value) audioPlayer.value.stop()
  audioPlayer.value = undefined as unknown as AudioPlayer

  entityBridge.ENianJing.request(_prompt, simulatorId, _model.value.id, (name: string, message: string, index: number, first: boolean, last: boolean, audio?: string) => {
    if (_prompt !== prompt.value || simulatorId !== speaker.value.id) {
      return
    }

    waitMessages.value.set(`${message}-${index}`, {
      name,
      message,
      audio: audio as unknown as string,
      index,
      first,
      last,
      timestamp: Date.now(),
      simulatorId
    })
  })
}

watch(inputPrompt, () => {
  if (!audioInput.value || !inputPrompt.value || !inputPrompt.value.length) return

  if (inputPrompt.value === prompt.value) return

  prompt.value = inputPrompt.value
  generate(inputPrompt.value, speaker.value.id)
  inputPrompt.value = ''
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

  audioError.value = ''
})

const onGenerateClick = () => {
  if (inputPrompt.value === prompt.value) return

  prompt.value = inputPrompt.value
  generate(inputPrompt.value, speaker.value.id)
  inputPrompt.value = ''
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
  if (_simulator.id === speaker.value.id) return

  generate(prompt.value, _simulator.id)

  speaker.value = _simulator
  selectingSimulator.value = false
}

const onSimulatorSelectorClose = () => {
  selectingSimulator.value = false
}

const onCancelSelectSimulatorClick = () => {
  selectingSimulator.value = false
}

onMounted(async () => {
  Taro.setNavigationBarTitle({
    title: 'AGI妙音坊'
  })
  if (Taro.getWindowInfo()) {
    scriptHeight.value = Taro.getWindowInfo().windowHeight - 32
  }

  typingTicker.value = window.setInterval(typing, typingInterval.value)
  await AudioPlayer.play('http://8.133.205.39:81/download/mp3/qiaomuyu.mp3', true).then((player: AudioPlayer | undefined) => {
    bgPlayer.value = player as AudioPlayer
  })

  model.Model.getModels(() => {
    simulator.Simulator.getSimulators(undefined, () => {
      _model.value = dbBridge._Model.model(dbBridge._Model.topicModelId()) as model._Model
      speaker.value = dbBridge._Simulator.randomPeek()

      generate(prompt.value, speaker.value.id)
    })
  })
})

onBeforeUnmount(() => {
  if (typingTicker.value >= 0) {
    window.clearInterval(typingTicker.value)
    typingTicker.value = -1
  }
  if (bgPlayer.value) {
    bgPlayer.value.stop()
    bgPlayer.value = undefined as unknown as AudioPlayer
  }
  if (audioPlayer.value) {
    audioPlayer.value.stop()
    audioPlayer.value = undefined as unknown as AudioPlayer
  }
})

const audioPlayer = ref(undefined as unknown as AudioPlayer)
const bgPlayer = ref(undefined as unknown as AudioPlayer)

const typing = () => {
  _typing(waitMessages.value, displayMessages.value, typingMessage.value, lastDisplayMessage.value, typingMessageIndex.value, audioPlayer.value, true, typingTicker.value, () => {
    lastDisplayMessage.value = undefined as unknown as Message
  }, typing, (_message: Message) => {
    return !_message || _message.name !== prompt.value
  }).then((rc) => {
    if (!rc) return

    generating.value = false

    audioPlayer.value = rc.audioPlayer as unknown as AudioPlayer
    if (rc.lastDisplayMessage) {
      lastDisplayMessage.value = rc.lastDisplayMessage
    }
    if (rc.typingInterval) {
      typingInterval.value = rc.typingInterval
      typingTicker.value = rc.typingTicker as number
    }
    if (rc.typingMessage) typingMessage.value = rc.typingMessage
    if (typingMessage.value && typingMessage.value.name !== prompt.value) {
      typingMessage.value = undefined as unknown as Message
    }

    typingMessageIndex.value = rc.typingMessageIndex || typingMessageIndex.value
  }).catch((e) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed typing: ${e}`)
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
