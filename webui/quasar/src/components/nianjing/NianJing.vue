<template>
  <q-page>
    <div :style='{width: "100%", height: `${contentHeight}px`}' class='flex justify-center items-center'>
      <q-resize-observer @resize='onWindowResize' />
      <div style='height: 100%; width: 600px; max-width: 100%;'>
        <div>
          <div style='font-size: 18px; font-weight: 600; margin: 8px 16px; text-align: center; height: 32px; line-height: 32px;'>
            <q-avatar size='32px'>
              <q-img :src='speaker?.simulator_avatar_url' />
            </q-avatar>
            <span class='q-ml-sm'>{{ speaker?.simulator }}</span>
            <span style='font-size: 12px' class='text-grey-6 q-mx-xs cursor-pointer' @click='singMode = !singMode'>
              {{ singMode ? '吟唱(试验)' : '念诵' }}
            </span>
            <q-icon name='help' size='16px' class='text-grey-6 cursor-pointer'>
              <q-tooltip style='font-size: 14px;'>
                请您了解：念诵模式可以选择角色声音，吟唱模式由吟唱模型决定声音。<br>吟唱模式需要完善的上下文生成连贯的音乐，因此需要等待。<br>吟唱模式当前处于试验阶段，并不能保证生成正确的音乐，请耐心等待稳定版本。
              </q-tooltip>
            </q-icon>
            <span class='q-ml-xs'>
              {{ prompt }}
            </span>
            <q-btn
              v-if='showSelectingSpeaker'
              flat
              dense
              color='light-blue'
              class='q-ml-xs'
              @click='selectingSpeaker = !selectingSpeaker'
            >
              换人
            </q-btn>
          </div>
          <q-separator />
          <q-img
            src='http://api.meipu-agi.cn/downloads/qiaomuyu.gif'
            style='width: 100%;'
          />
          <q-resize-observer @resize='onHeadBoxResize' />
        </div>
        <div v-if='generating' class='flex justify-center items-center' style='height: 128px; width: 100%'>
          <div class='text-center'>
            <q-spinner-facebook class='text-red-4' size='64px' />
            <div style='font-size: 14px;'>师傅正在准备，请稍候...</div>
          </div>
        </div>
        <q-scroll-area
          v-else
          :style='{ height: `calc(100% - ${headHeight}px - 68px)`, width: "100%", padding: "8px 0" }'
          ref='chatBox'
          :bar-style='{ width: "2px" }'
          :thumb-style='{ width: "2px" }'
          class='cursor-pointer'
        >
          <div>
            <q-resize-observer @resize='onChatBoxResize' />
            <div v-for='(message, index) in displayMessages' :key='index' :style='{borderTop: index > 0 ? "1px solid lightgray" : "", padding: "8px 0", textAlign: "center", marginBottom: "4px"}'>
              <div style='font-size: 14px; color: gray'>
                {{ message.message }}
              </div>
            </div>
            <div v-if='lastDisplayMessage' style='padding: 8px 0; text-align: center; border-top: 1px solid lightgray; margin-bottom: 4px;'>
              <div style='font-size: 14px; color: gray;'>
                {{ lastDisplayMessage.message }}
              </div>
            </div>
          </div>
        </q-scroll-area>
        <div class='flex justify-center items-center'>
          <BottomFixInput
            v-model='inputPrompt'
            placeholder='听一段经文，让心静下来~'
            @enter='onPromptEnter'
            style='width: 540px; max-width: calc(100% - 8px);'
            :disabled='generating'
            :loading='generating'
          />
        </div>
      </div>
      <div v-if='!showSelectingSpeaker' class='full-height q-pt-lg'>
        <RightBottomSimulatorList @selected='onSimulatorSelected' />
      </div>
    </div>
    <q-dialog v-if='showSelectingSpeaker' v-model='selectingSpeaker'>
      <SimulatorList
        v-model:selected='speaker'
        @selected='onSimulatorSelected'
      />
    </q-dialog>
  </q-page>
</template>

<script setup lang='ts'>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { dbBridge, entityBridge } from 'src/bridge'
import { model, setting, simulator } from 'src/localstores'
import { AudioPlayer } from 'src/player'
import { typing as _typing, Message as MessageBase } from 'src/typing'
import { Platform, QScrollArea } from 'quasar'
import { dbModel } from 'src/model'

import BottomFixInput from '../input/BottomFixInput.vue'
import RightBottomSimulatorList from '../list/RightBottomSimulatorList.vue'
import SimulatorList from '../list/SimulatorList.vue'

const contentHeight = computed(() => setting.Setting.contentHeight())

const prompt = ref('般若波罗密心经')
const inputPrompt = ref(prompt.value)

const audioInput = ref(false)
const audioError = ref('')
const singMode = ref(false)

const chatBox = ref<QScrollArea>()
const headHeight = ref(0)

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
const bgPlayerTimer = ref(-1)

const music = ref(undefined as unknown as string)
const musicPlayer = ref(undefined as unknown as AudioPlayer)
const lrcLetters = ref(0)

const generating = ref(false)
const selectingSpeaker = ref(false)
const windowWidth = ref(0)
const showSelectingSpeaker = computed(() => Platform.is.mobile || windowWidth.value < 1280)

const speaker = ref(undefined as unknown as simulator._Simulator)
const _model = ref(undefined as unknown as model._Model)

const eNianjing = ref(undefined as unknown as entityBridge.ENianJing)

const generate = (_prompt: string, simulatorId: number) => {
  generating.value = true

  displayMessages.value = []
  waitMessages.value = new Map<string, Message>()
  lastDisplayMessage.value = undefined as unknown as Message
  typingMessage.value = undefined as unknown as Message
  typingMessageIndex.value = 0

  if (audioPlayer.value) audioPlayer.value.stop()
  audioPlayer.value = undefined as unknown as AudioPlayer

  if (musicPlayer.value) musicPlayer.value.stop()
  musicPlayer.value = undefined as unknown as AudioPlayer

  eNianjing.value?.request(_prompt, speaker.value.id, _model.value.id, (message: string, index: number, first: boolean, last: boolean, audio?: string) => {
    if (_prompt !== prompt.value || simulatorId !== speaker.value.id) {
      return
    }

    waitMessages.value.set(`${message}-${index}`, {
      name: _prompt,
      message,
      audio: audio as string,
      index,
      first,
      last,
      timestamp: Date.now(),
      simulatorId
    })
  }, (name: string, _music: string, letters: number) => {
    if (name != prompt.value) {
      return
    }
    music.value = _music
    lrcLetters.value = letters
  })
}

watch(inputPrompt, () => {
  if (!audioInput.value || !prompt.value || !prompt.value.length) return

  generate(prompt.value, speaker.value.id)
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

  audioError.value = ''
})

const onPromptEnter = (_prompt: string) => {
  if (!_prompt.length) return
  if (_prompt === prompt.value) return

  generate(_prompt, speaker.value.id)
  prompt.value = _prompt
}

const initializeNianjing = async () => {
  _model.value = await dbBridge._Model.model(await dbBridge._Model.topicModelId()) as model._Model
  speaker.value = await dbBridge._Simulator.randomPeek()

  generate(prompt.value, speaker.value.id)
}

const playBgSound = () => {
  AudioPlayer.play('http://api.meipu-agi.cn/downloads/qiaomuyu.mp3', true).then((player: AudioPlayer | undefined) => {
    bgPlayer.value = player as AudioPlayer
  }).catch(() => {
    bgPlayerTimer.value = window.setTimeout(playBgSound, 1000)
  })
}

onMounted(async () => {
  eNianjing.value = new entityBridge.ENianJing()

  setting.Setting.setCurrentMenu('nianjing')

  const style = await dbBridge._Setting.get(dbModel.SettingKey.NIANJING_STYLE)
  singMode.value = style !== '念诵'

  model.Model.getModels(() => {
    simulator.Simulator.getSimulators(undefined, () => {
      void initializeNianjing()
    })
  })

  typingTicker.value = window.setInterval(typing, typingInterval.value)

  playBgSound()
})

onBeforeUnmount(() => {
  eNianjing.value.stop()
  eNianjing.value = undefined as unknown as entityBridge.ENianJing

  if (typingTicker.value >= 0) {
    window.clearInterval(typingTicker.value)
    typingTicker.value = -1
  }
  if (audioPlayer.value) {
    audioPlayer.value.stop()
    audioPlayer.value = undefined as unknown as AudioPlayer
  }
  if (bgPlayer.value) {
    bgPlayer.value.stop()
    bgPlayer.value = undefined as unknown as AudioPlayer
  }
  if (bgPlayerTimer.value >= 0) {
    window.clearTimeout(bgPlayerTimer.value)
    bgPlayerTimer.value = -1
  }
  if (musicPlayer.value) {
    musicPlayer.value.stop()
    musicPlayer.value = undefined as unknown as AudioPlayer
  }
})

const audioPlayer = ref(undefined as unknown as AudioPlayer)
const bgPlayer = ref(undefined as unknown as AudioPlayer)

const typing = () => {
  const disablePlay = singMode.value && music.value !== undefined && lrcLetters.value > 0

  _typing(
    waitMessages.value,
    displayMessages.value,
    typingMessage.value,
    lastDisplayMessage.value,
    typingMessageIndex.value,
    audioPlayer.value,
    !disablePlay, // If we have music, don't play inside
    typingTicker.value,
    () => {
      lastDisplayMessage.value = undefined as unknown as Message
    },
    typing,
    (_message: Message | undefined) => {
      return !_message || _message.name !== prompt.value
    }).then((rc) => {
      if (!rc) return

      if (rc.audioPlayer) audioPlayer.value = rc.audioPlayer
      if (rc.lastDisplayMessage) {
        lastDisplayMessage.value = rc.lastDisplayMessage
      }
      if (rc.typingInterval) {
        typingInterval.value = rc.typingInterval
        typingTicker.value = rc.typingTicker as number
      }
      if (rc.typingMessage) {
        typingMessage.value = rc.typingMessage
      }

      typingMessageIndex.value = rc.typingMessageIndex || typingMessageIndex.value

      if (typingMessage.value && typingMessage.value.last) {
        for (const _message of displayMessages.value) {
          waitMessages.value.set(`${_message.message}-${_message.index}`, _message)
        }
        waitMessages.value.set(`${typingMessage.value.message}-${typingMessage.value.index}`, typingMessage.value)
        displayMessages.value = []
        typingMessageIndex.value = 0
      }
      if (typingMessage.value && typingMessage.value.first) {
        generating.value = false
        inputPrompt.value = ''
        if (disablePlay) {
          if (musicPlayer.value) musicPlayer.value.stop()

          window.clearInterval(typingTicker.value)
          typingTicker.value = -1
          AudioPlayer.play(music.value).then((player) => {
            typingInterval.value = Math.ceil(
              (player.duration * 1000) / lrcLetters.value
            )
            typingTicker.value = window.setInterval(typing, typingInterval.value)
            musicPlayer.value = player
          }).catch((e) => {
            typingTicker.value = window.setInterval(typing, typingInterval.value)
            console.log(`Failed play: ${e}`)
          })
        }
      }
    }).catch((e) => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Failed typing: ${e}`)
    })
}

const onChatBoxResize = (size: { height: number }) => {
  chatBox.value?.setScrollPosition('vertical', size.height, 300)
}

const onHeadBoxResize = (size: { height: number }) => {
  headHeight.value = size.height
}

const onSimulatorSelected = (_simulator: simulator._Simulator) => {
  selectingSpeaker.value = false

  if (_simulator.id === speaker.value.id) {
    return
  }

  speaker.value = _simulator
  generate(prompt.value, _simulator.id)
}

const onWindowResize = (size: { width: number }) => {
  windowWidth.value = size.width
}

</script>

<style lang='sass'>
</style>
