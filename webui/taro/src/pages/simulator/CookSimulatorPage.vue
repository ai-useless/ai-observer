<template>
  <View style='padding: 16px;'>
    <View style='margin-top: 16px; font-weight: 600; font-size: 14px;'>ID</View>
    <Input :value='simulatorId' @input='onSimulatorIdInput' placeholder='独一无二屌炸天的模拟器标识' style='border-radius: 4px; border: 1px solid lightblue; font-size: 12px; padding: 4px; margin-top: 4px;' />

    <View style='margin-top: 16px; font-weight: 600; font-size: 14px;'>头像</View>
    <View style='width: 100%; height: 80px; border-radius: 16px; border: 1px dashed gray; display: flex; justify-content: center; align-items: center; margin-top: 4px;' @click='onChooseAvatar'>
      <Image :src='simulatorAvatar.length ? simulatorDisplayAvatar : addCircle' :style='{ width: simulatorAvatar.length ? "80px" : "48px", height: simulatorAvatar.length ? "100%" : "48px" }' />
    </View>
    <View style='margin-top: 16px; font-weight: 600; font-size: 14px;'>声音（可以用方言录制哦）</View>
    <View style='width: 100%; height: 80px; border-radius: 16px; border: 1px dashed gray; display: flex; justify-content: center; align-items: center; margin-top: 4px;'>
      <View v-if='simulatorAudio.length'>
        <Image :src='playCircle' style='width: 48px; height: 48px;' />
      </View>
      <View v-else @click='onRecordAudioClick'>
        <Image :src='mic' style='width: 48px; height: 48px;' />
      </View>
      <View v-if='simulatorAudio.length' @click='onRecordAudioClick'>
        <Image :src='mic' style='width: 16px; height: 16px; margin-top: 32px;' />
      </View>
    </View>
    <View style='display: flex; margin-top: 4px;' @click='onChooseAudioFileClick'>
      <Image :src='folder' style='width: 16px; height: 16px;' />
      <View style='color: blue; font-size: 12px; margin-left: 4px;'>或者从音频文件选择</View>
    </View>
    <View style='display: flex; margin-top: 4px;'>
      <Image :src='warnCircle' style='width: 16px; height: 16px;' />
      <View style='color: gray; font-size: 12px; margin-left: 4px;'>您应该确保您拥有声音的版权，并且确保上传的声音符合公序良俗和国家政策</View>
    </View>
    <View style='margin-top: 16px; font-weight: 600; font-size: 14px;'>原型</View>
    <Input :value='simulatorArchetype' @input='onSimulatorArchetypeInput' placeholder='模拟器的原型人物，例如：电视剧亮剑主角李云龙' style='border-radius: 4px; border: 1px solid lightblue; font-size: 12px; padding: 4px; margin-top: 4px;' />
    <View style='display: flex; margin-top: 4px;'>
      <Image :src='warnCircle' style='width: 16px; height: 16px;' />
      <View style='color: gray; font-size: 12px; margin-left: 4px;'>您应该确保您选择的模拟器原型符合公序良俗和国家政策</View>
    </View>
    <View style='margin-top: 16px; font-weight: 600; font-size: 14px;'>人设</View>
    <Input type='textarea' :value='simulatorPersonality' @input='onSimulatorPersonalityInput' placeholder='例如：带着二营长和意大利炮拿下平安县城，但是没有解救成功自己的女人的独立团团长' style='border-radius: 4px; border: 1px solid lightblue; font-size: 12px; padding: 4px; margin-top: 4px;' />
    <View style='display: flex; margin-top: 4px;'>
      <Image :src='warnCircle' style='width: 16px; height: 16px;' />
      <View style='color: gray; font-size: 12px; margin-left: 4px;'>您应该确保您设置的模拟器人设符合公序良俗和国家政策</View>
    </View>

    <View style='padding-bottom: 4px; margin-top: 24px;'>请您了解</View>
    <View style='border: 1px solid lightcoral; border-radius: 8px; padding: 8px; font-size: 12px; color: gray;'>
      本阶段定制AGI模拟器是所有没谱儿的AGI用户都可以使用的。没谱儿的AGI将来或许会推出用户专属的AGI模拟器，但现在用户创建的所有定制角色都将被全网用户使用。
    </View>

    <Button size='mini' style='width: 100%; margin-top: 16px;' @click='onCreateSimulatorClick'>
      创建模拟器
    </Button>
  </View>
</template>

<script setup lang='ts'>
import axios from 'taro-axios'
import { constants } from 'src/constant'
import { user } from 'src/localstores'
import { computed, onMounted, ref } from 'vue'
import Taro from '@tarojs/taro'
import { View, Input, Button, Image } from '@tarojs/components'

import { addCircle, mic, folder, warnCircle, playCircle } from 'src/assets'

const username = computed(() => user.User.username())
const avatar = computed(() => user.User.avatar())

const simulatorId = ref('')
const simulatorAvatar = ref('')
const simulatorAvatarType = ref('')
const simulatorDisplayAvatar = computed(() => `data:image/${simulatorAvatarType.value};base64,${simulatorAvatar.value}`)
const simulatorAudio = ref('')
const simulatorArchetype = ref('')
const simulatorPersonality = ref('')

const onSimulatorIdInput = (e: { detail: { value: string } }) => {
  simulatorId.value = e.detail.value
}

const onSimulatorArchetypeInput = (e: { detail: { value: string } }) => {
  simulatorArchetype.value = e.detail.value
}

const onSimulatorPersonalityInput = (e: { detail: { value: string } }) => {
  simulatorPersonality.value = e.detail.value
}

const readAsBase64 = async (filePath: string) => {
  const fs = Taro.getFileSystemManager()
  const b64 = await new Promise((resolve, reject) => {
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (r) => resolve(r.data),
      fail: (e) => reject(e)
    })
  })
  return b64
}

const imageExtension = async (imagePath: string) => {
  if (imagePath.endsWith('.svg')) return 'svg+xml'
  return new Promise((resolve, reject) => {
    Taro.getImageInfo({
      src: imagePath,
      success: (res) => {
        resolve(res.type)
      },
      fail: (e) => {
        reject(e)
      }
    })
  })
}

const onChooseAvatar = () => {
  Taro.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera', 'user', 'environment'],
    success: (res) => {
      readAsBase64(res.tempFilePaths[0]).then((b64: string) => {
        imageExtension(res.tempFilePaths[0]).then((type: string) => {
          simulatorAvatarType.value = type
          simulatorAvatar.value = b64
        }).catch((e) => {
          console.log(`Failed get image info: ${JSON.stringify(e)}`)
        })
      }).catch((e) => {
        console.log(`Failed read file: ${JSON.stringify(e)}`)
      })
    },
    fail: (e) => {
      console.log(`Failed choose avatar: ${JSON.stringify(e)}`)
    }
  })
}

const uploadAudioB64 = async (audioB64: string) => {
  if (!username.value) {
    try {
      await login()
    } catch (e) {
      console.log(`Failed login: ${e}`)
      return
    }
  }

  Taro.login().then((code) => {
    axios.post(constants.COOK_AUDIO_API, {
      code: code.code,
      username: username.value,
      avatar: avatar.value,
      audio_b64: audioB64
    }).then((audioUrl) => {
      console.log(audioUrl)
    }).catch(() => {
      Taro.showToast({
        title: '上传失败！',
        icon: 'error',
        duration: 1000
      })
    })
  }).catch(() => {
    Taro.showToast({
      title: '认证失败！',
      icon: 'error',
      duration: 1000
    })
  })
}

const login = async () => {
  return new Promise((resolve, reject) => {
    Taro.getUserProfile({
      desc: '用于完善用户信息',
      success: (res) => {
        user.User.setAvatar(res.userInfo.avatarUrl)
        user.User.setUsername(res.userInfo.nickName)
        resolve(undefined)
      },
      fail: (e) => {
        Taro.showToast({
          title: `获取用户信息失败：${JSON.stringify(e)}`,
          icon: 'error',
          duration: 1000
        })
        reject(e)
      }
    })
  })
}

const onChooseAudioFileClick = async () => {
  const extensions = ['mp3', 'wav']
  Taro.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['mp3', 'wav']
  }).then((res) => {
    if (!res.tempFiles[0].path.endsWith(extensions[0]) && !res.tempFiles[0].path.endsWith(extensions[1])) {
      Taro.showToast({
        title: '无效音频文件！',
        icon: 'error',
        duration: 1000
      })
      return
    }
    readAsBase64(res.tempFiles[0].path).then((audioB64: string) => {
      if (audioB64.length > 8 * 1024 * 1024) {
        Taro.showToast({
          title: '文件太大了！',
          icon: 'error',
          duration: 1000
        })
        return
      }
      simulatorAudio.value = audioB64
    }).catch((e) => {
      Taro.showToast({
        title: `读取文件失败：${JSON.stringify(e)}`,
        icon: 'error',
        duration: 1000
      })
    })
  }).catch((e) => {
    console.log(`选择文件失败: ${JSON.stringify(e)}`)
  })
}

const recorderManager = Taro.getRecorderManager()
const recordingText = ref('')
const recordError = ref(false)
const recordStarted = ref(false)

const onRecordAudioClick = () => {
  recorderManager.start({
    duration: 60000,
    sampleRate: 44100,
    numberOfChannels: 1,
    encodeBitRate: 192000,
    format: 'mp3',
    frameSize: 50
  })
}

const onCreateSimulatorClick = () => {
  // TODO
}

onMounted(() => {
  recorderManager.onStart(() => {
    recordingText.value = '正在录制...'
    recordError.value = false
    recordStarted.value = true

    Taro.showModal({
      title: '正在录制',
      content: recordingText.value,
      showCancel: false,
      confirmText: '停止录制',
      success: () => {
        if (recordError.value) return
        recorderManager.stop()
      }
    })
  })
  recorderManager.onStop((res) => {
    console.log('停止', res.tempFilePath)
  })
  recorderManager.onError(() => {
    if (!recordStarted.value) {
      Taro.showToast({
        title: '录制出错了！',
        icon: 'error',
        duration: 1000
      })
      return
    }

    recordingText.value = '录制出错了！'
    recordError.value = true
  })
})

</script>
