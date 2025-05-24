<template>
  <div class='full-height full-width'>
    <q-scroll-area
      ref='chatBox'
      :bar-style='{ width: "2px" }'
      :thumb-style='{ width: "2px" }'
      class='q-mt-xs cursor-pointer full-height full-width'
    >
      <div style='font-weight: 600; font-size: 14px;'>ID</div>
      <q-input
        filled
        dense
        v-model='simulatorId'
        placeholder='独一无二屌炸天的模拟器标识'
        style='border-radius: 4px; border: 1px solid lightblue; font-size: 12px; margin-top: 4px;'
      />

      <div style='margin-top: 16px; font-weight: 600; font-size: 14px;'>头像</div>
      <div style='width: 100%; height: 80px; border-radius: 16px; border: 1px dashed gray; display: flex; justify-content: center; align-items: center; margin-top: 4px;' @click='onChooseAvatar' class='cursor-pointer'>
        <q-img :src='simulatorAvatarUrl?.length ? simulatorAvatarUrl : addCircle' :style='{ width: simulatorAvatarUrl?.length ? "80px" : "48px", height: simulatorAvatarUrl?.length ? "100%" : "48px" }' />
      </div>
      <div style='margin-top: 16px; font-weight: 600; font-size: 14px;'>声音（可以用方言录制哦）</div>
      <div style='width: 100%; height: 80px; border-radius: 16px; border: 1px dashed gray; display: flex; justify-content: center; align-items: center; margin-top: 4px;' class='cursor-pointer'>
        <div v-if='simulatorAudioUrl?.length' @click='onPlayAudioClick'>
          <q-img :src='playing ? stopCircle : playCircle' style='width: 48px; height: 48px;' />
        </div>
        <div v-else-if='!recording' @click='onRecordAudioClick'>
          <q-img :src='mic' style='width: 48px; height: 48px;' />
        </div>
        <div v-else @click='onStopRecordClick' class='row flex items-center'>
          <div v-for='(wave, index) in waves' :key='index' :style='{ borderRight: "2px solid gray", height: `${wave}px`, marginRight: "1px" }' />
          <q-img :src='stopCircle' style='width: 48px; height: 48px;' class='q-ml-sm' />
        </div>
        <div v-if='simulatorAudio.length' @click='onRecordAudioClick'>
          <q-img :src='mic' style='width: 16px; height: 16px; margin-top: 32px;' />
        </div>
      </div>
      <div style='display: flex; margin-top: 4px;' @click='onChooseAudioFileClick' class='cursor-pointer'>
        <q-img :src='folder' style='width: 16px; height: 16px;' />
        <div style='color: blue; font-size: 12px; margin-left: 4px;'>或者从音频文件选择</div>
      </div>
      <div style='display: flex; margin-top: 4px;'>
        <q-img :src='warnCircle' style='width: 16px; height: 16px;' />
        <div style='color: gray; font-size: 12px; margin-left: 4px;'>您应该确保您拥有声音的版权，并且确保上传的声音符合公序良俗和国家政策</div>
      </div>
      <div style='margin-top: 16px; font-weight: 600; font-size: 14px;'>原型</div>
      <q-input
        filled
        dense
        v-model='simulatorArchetype'
        placeholder='模拟器的原型人物，例如：电视剧亮剑主角李云龙'
        style='border-radius: 4px; border: 1px solid lightblue; font-size: 12px; margin-top: 4px;'
      />
      <div style='display: flex; margin-top: 4px;'>
        <q-img :src='warnCircle' style='width: 16px; height: 16px;' />
        <div style='color: gray; font-size: 12px; margin-left: 4px;'>您应该确保您选择的模拟器原型符合公序良俗和国家政策</div>
      </div>
      <div style='margin-top: 16px; font-weight: 600; font-size: 14px;'>头衔</div>
      <q-input
        filled
        dense
        v-model='simulatorTitle'
        placeholder='模拟器的头衔，例如：八路军独立团团长'
        style='border-radius: 4px; border: 1px solid lightblue; font-size: 12px; margin-top: 4px;'
      />
      <div style='display: flex; margin-top: 4px;'>
        <q-img :src='warnCircle' style='width: 16px; height: 16px;' />
        <div style='color: gray; font-size: 12px; margin-left: 4px;'>您应该确保您选择的模拟器头衔符合公序良俗和国家政策</div>
      </div>
      <div style='margin-top: 16px; font-weight: 600; font-size: 14px;'>人设</div>
      <q-input
        filled
        dense
        type='textarea'
        v-model='simulatorPersonality'
        placeholder='例如：带着二营长和意大利炮拿下平安县城，但是没有解救成功自己的女人的独立团团长'
        style='border-radius: 4px; border: 1px solid lightblue; font-size: 12px; margin-top: 4px;'
      />
      <div style='display: flex; margin-top: 4px;'>
        <q-img :src='warnCircle' style='width: 16px; height: 16px;' />
        <div style='color: gray; font-size: 12px; margin-left: 4px;'>您应该确保您设置的模拟器人设符合公序良俗和国家政策</div>
      </div>

      <div style='padding-bottom: 4px; margin-top: 24px;'>请您了解</div>
      <div style='border: 1px solid lightcoral; border-radius: 8px; padding: 8px; font-size: 12px; color: gray;'>
        本阶段定制AGI模拟器是所有没谱儿的AGI用户都可以使用的。没谱儿的AGI将来或许会推出用户专属的AGI模拟器，但现在用户创建的所有定制角色都将被全网用户使用。
      </div>

      <q-btn
        flat
        rounded
        style='width: 100%; margin-top: 16px;'
        @click='onCreateSimulatorClick'
        :loading='creating'
        class='border-gradient-bg-blue text-white'
      >
        创建模拟器
      </q-btn>

      <q-file
        ref='avatarSelector'
        v-model='simulatorAvatar'
        accept='image/*'
        style='display: none'
        @change='onImageChange'
        clearable
      />
      <q-file
        ref='audioSelector'
        v-model='simulatorAudioPath'
        accept='audio/*'
        style='display: none'
        @change='onAudioChange'
        clearable
      />
    </q-scroll-area>
  </div>
</template>

<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
import { QFile } from 'quasar'
import { simulator, user } from 'src/localstores'
import { AudioPlayer } from 'src/player'

import { addCircle, mic, folder, warnCircle, playCircle, stopCircle } from 'src/assets'

const username = computed(() => user.User.username())
const avatar = computed(() => user.User.avatar())

const simulatorId = ref('')
const avatarSelector = ref<QFile>()
const simulatorAvatar = ref<File | null>(null)
const simulatorAvatarUrl = ref<string | null>(null)
const simulatorAudio = ref('')
const audioSelector = ref<QFile>()
const simulatorAudioPath = ref<File | null>(null)
const simulatorAudioUrl = ref<string | null>(null)
const playing = ref(false)
const simulatorArchetype = ref('')
const simulatorPersonality = ref('')
const simulatorTitle = ref('')
const creating = ref(false)

const recording = ref(false)
const audioBlob = ref<Blob | null>(null)
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<BlobPart[]>([])
const waves = ref(new Array(100))
const waveTicker = ref(-1)

const onChooseAvatar = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  avatarSelector.value?.$el.querySelector('input[type=file]')?.click()
}

watch(simulatorAvatar, () => {
  if (simulatorAvatarUrl.value) {
    URL.revokeObjectURL(simulatorAvatarUrl.value)
  }
})

const onChooseAudioFileClick = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  audioSelector.value?.$el.querySelector('input[type=file]')?.click()
}

const onImageChange = (files: File | File[] | null) => {
  if (!files) {
    simulatorAvatarUrl.value = null
    return
  }
  const selectedFile = Array.isArray(files) ? files[0] : files

  if (selectedFile && selectedFile.type.startsWith('image/')) {
    simulatorAvatarUrl.value = URL.createObjectURL(selectedFile)
  } else {
    simulatorAvatarUrl.value = null
  }
}

watch(simulatorAudioPath, () => {
  if (simulatorAudioUrl.value) {
    URL.revokeObjectURL(simulatorAudioUrl.value)
  }
})

const onAudioChange = (files: File | File[] | null) => {
  if (!files) {
    simulatorAudioUrl.value = null
    return
  }
  const selectedFile = Array.isArray(files) ? files[0] : files

  if (selectedFile && selectedFile.type.startsWith('audio/')) {
    if (simulatorAudioUrl.value) {
      URL.revokeObjectURL(simulatorAudioUrl.value)
    }
    simulatorAudioUrl.value = URL.createObjectURL(selectedFile)
  } else {
    simulatorAudioUrl.value = null
  }
}

const updateWaves = () => {
  for (let i = 0; i < waves.value.length; i++) {
    waves.value[i] = Math.floor(Math.random() * 50)
  }
}

const onRecordAudioClick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.value = new MediaRecorder(stream)

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }

    mediaRecorder.value.onstop = () => {
      audioBlob.value = new Blob(audioChunks.value, { type: 'audio/wav' })
      audioChunks.value = []
      if (simulatorAudioUrl.value) {
        URL.revokeObjectURL(simulatorAudioUrl.value)
      }
      simulatorAudioUrl.value = URL.createObjectURL(audioBlob.value)
    }

    mediaRecorder.value.start()
    recording.value = true
    waveTicker.value = window.setInterval(updateWaves, 100)
  } catch (e) {
    console.log('Failed record: ', e)
  }
}

const onStopRecordClick = () => {
  mediaRecorder.value?.stop()
  recording.value = false
  window.clearInterval(waveTicker.value)
}

const audioPlayer = ref<AudioPlayer | null>(null)

const onPlayAudioClick = async () => {
  playing.value = !playing.value

  if (!playing.value && audioPlayer.value) {
    audioPlayer.value.stop()
    audioPlayer.value = null
  }

  if (!playing.value || !simulatorAudioUrl.value) return

  audioPlayer.value = await AudioPlayer.play(simulatorAudioUrl.value, false, () => {
    playing.value = false
  }) as AudioPlayer
}

const onCreateSimulatorClick = () => {
  creating.value = true

  simulator.Simulator.createSimulator({
    username: username.value,
    avatar: avatar.value,
    audio_b64: simulatorAudio.value,
    simulator: simulatorId.value,
    simulator_avatar: simulatorAvatar.value,
    personality: simulatorPersonality.value,
    simulator_archetype: simulatorArchetype.value,
    simulator_title: simulatorTitle.value
  }, () => {
    creating.value = false
  })
}

</script>
