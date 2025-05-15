<template>
  <View>
    <View style='font-size: 12px; color: gray;'>表演主题</View>
    <Input :value='topic' style='border: 1px solid lightgray; border-radius: 4px; width: calc(100% - 48px); padding: 4px 8px; margin-top: 8px;' @input='onTopicInput' />
    <View style='display: flex; margin-top: 16px;'>
      <View style='font-size: 12px; color: gray;'>选择AGI模型</View>
    </View>
    <View style='margin-top: 8px;'>
      <View style='padding: 8px 0; border-bottom: 1px solid gray; width: calc(100% - 32px);'>
        <View v-if='!topicModel' style='display: flex; align-items: center;'>
          <View style='text-align: center;'>
            <Image :src='personCircle' style='width: 48px; height: 48px;' />
          </View>
          <View style='font-size: 12px; color: blue; margin-left: 16px;' @click='_onSelectModelClick'>点击选择模型</View>
        </View>
        <View v-else @click='_onSelectModelClick'>
          <ModelCard :model='topicModel' />
        </View>
      </View>
    </View>
    <View style='display: flex; margin-top: 16px;'>
      <View style='font-size: 12px; color: gray;'>选择相声演员或</View>
      <View style='font-size: 12px; color: blue;' @click='onRandomGuestClick'>随机安排</View>
    </View>
    <View style='margin-top: 8px;'>
      <View v-for='(guest, index) in guests' :key='index' style='padding: 8px 0; border-bottom: 1px solid gray; width: calc(100% - 32px);'>
        <View v-if='!guest' style='display: flex; align-items: center;'>
          <View style='text-align: center;'>
            <Image :src='personCircle' style='width: 48px; height: 48px;' />
            <View v-if='index === 0' style='font-size: 12px; color: gray;'>逗哏</View>
          </View>
          <View style='font-size: 12px; color: blue; margin-left: 16px;' @click='onSelectGuestClick(index)'>{{ index === 0 ? '点击选择逗哏' : '点击选择捧哏' }}</View>
        </View>
        <View v-else @click='onSelectGuestClick(index)'>
          <RoleCard :simulator='guest' :role='index === 0 ? "逗哏" : ""' />
        </View>
      </View>
    </View>
    <Button
      @click='onStartDiscussClick'
      size='mini'
      :style='{ width: "calc(100% - 32px)", marginTop: "16px", borderRadius: "8px", color: ready ? "blue" : "gray" }'
      :disabled='!ready'
    >
      开始表演
    </Button>
    <View style='margin-top: 16px;'>
      <View style=' width: calc(100% - 32px); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid gray;'>
        <View class='title'>你可能会喜欢</View>
        <View>
          <Button class='title plain-btn' size='mini' plain style='color: blue;' @click='onChangeTopicsClick' :loading='generating'>{{ generating ? '生成中...' : '换一批' }}</Button>
        </View>
      </View>
      <View v-if='topics.length' style='margin-top: 8px; width: calc(100% - 32px);'>
        <View style='font-size: 14px; color: gray;' @click='onTopicClick("各领域的经典相声")'>
          各领域的经典相声
        </View>
        <View v-for='_topic in topics' style='font-size: 14px; color: blue;' @click='onTopicClick(_topic)'>
          {{ _topic }}
        </View>
      </View>
      <View v-else class='title' style='height: 200px; display: flex; justify-content: center; align-items: center; width: calc(100% - 32px);'>
        AGI正在为您生成相声主题...
      </View>
    </View>
  </View>
  <AtModal :is-opened='selectingSimulator' @close='onSimulatorSelectorClose'>
    <AtModalHeader>选择{{ selectingSimulatorIndex === 0 ? '逗哏' : '捧哏' }}模拟器</AtModalHeader>
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
  <AtModal :is-opened='selectingModel' @close='onModelSelectorClose'>
    <AtModalHeader>选择{{ selectingSimulatorIndex === 0 ? '逗哏' : '捧哏' }}模型</AtModalHeader>
    <AtModalContent>
      <View>
        <View v-for='(_model, index) in models' :key='index' style='border-bottom: 1px solid gray;' @click='onSelectModelClick(_model)'>
          <ModelCard :model='_model' />
        </View>
      </View>
    </AtModalContent>
    <AtModalAction>
      <Button @click='onCancelSelectModelClick'>取消</Button>
    </AtModalAction>
  </AtModal>
</template>

<script setup lang='ts'>
import Taro from '@tarojs/taro'
import { computed, onMounted, ref } from 'vue'
import { AtModal, AtModalHeader, AtModalContent, AtModalAction } from 'taro-ui-vue3'
import { model, xiangsheng, setting, simulator } from 'src/localstores'
import { View, Button, Image, Input } from '@tarojs/components'
import { dbBridge, entityBridge } from 'src/bridge'
import { uuid } from 'src/utils'
import { dbModel } from 'src/model'

import { personCircle } from 'src/assets'

import SimulatorCard from '../../simulator/SimulatorCard.vue'
import ModelCard from '../../model/ModelCard.vue'
import RoleCard from './RoleCard.vue'

const selectingSimulatorIndex = ref(0)
const selectingSimulator = ref(false)
const selectingModel = ref(false)

const guests = ref([] as simulator._Simulator[])
const host = computed(() => guests.value[0])
const guest = computed(() => guests.value[1])
const topicModel = ref(dbBridge._Model.model(dbBridge._Model.topicModelId()))

const ready = computed(() => host.value && guest.value)

const models = computed(() => model.Model.models())
const simulators = computed(() => simulator.Simulator.allSimulators().filter((el) => [host.value, guest.value].findIndex((_el) => _el && _el.simulator === el.simulator) < 0))

const topic = computed(() => xiangsheng.Xiangsheng.topic())
const historyTopics = ref([] as string[])
const topics = ref([] as string[])
const generating = ref(true)

const generateTopics = () => {
  generating.value = true
  entityBridge.EXiangsheng.prepareTopics(historyTopics.value).then((_topics) => {
    generating.value = false
    if (!_topics || !_topics.topics.length) {
      setTimeout(() => generateTopics(), 1000)
      return
    }
    historyTopics.value.push(...topics.value)
    topics.value = _topics.topics
  }).catch((e) => {
    console.log(`Failed change topics: ${e}`)
    generating.value = false
    setTimeout(() => generateTopics(), 1000)
  })
}

const onChangeTopicsClick = () => {
  generateTopics()
}

const onTopicClick = (_topic: string) => {
  xiangsheng.Xiangsheng.setTopic(_topic)
  if (!host.value || !guest.value) return
  startXiangsheng()
}

const onTopicInput = (e: { detail: { value: string } }) => {
  xiangsheng.Xiangsheng.setTopic(e.detail.value)
}

const startXiangsheng = () => {
  const _uid = uuid.newUuid()
  const participators = [host.value, guest.value].map((el, index) => {
    return {
      id: index,
      simulatorId: el.id,
      seminarUid: _uid,
      role: index === 0 ? dbModel.Role.HOST : dbModel.Role.GUEST,
      modelId: topicModel.value ? topicModel.value.id : 0
    }
  }) as dbModel.Participator[]

  // TODO: check if it's a valid topic
  dbBridge._Xiangsheng.create(_uid, topic.value, participators)
  xiangsheng.Xiangsheng.setXiangsheng(_uid)
  setting.Setting.setTabIndex(2)
  Taro.switchTab({ url: '/pages/xiangsheng/XiangshengPage' })
}

const onStartDiscussClick = () => {
  startXiangsheng()
}

const randomSelect = () => {
  for (let i = 0; i < guests.value.length; i++) {
    guests.value[i] = undefined as unknown as simulator._Simulator
  }

  for (let i = 0; i < guests.value.length; i++) {
    while (true) {
      let _simulator = dbBridge._Simulator.randomPeek(i === 0 ? true : undefined)
      if (!_simulator) _simulator = dbBridge._Simulator.randomPeek()
      if (guests.value.findIndex((el) => el && el.simulator === _simulator.simulator) >= 0) continue
      guests.value[i] = _simulator
      break
    }
  }
}

const onRandomGuestClick = () => {
  Taro.showLoading({
    title: '随机选择中...'
  })
  setTimeout(() => {
    randomSelect()
    Taro.hideLoading()
  }, 100)
}

onMounted(() => {
  Taro.setNavigationBarTitle({
    title: 'AGI相声'
  })

  for (let i = 0; i < 2; i++) {
    guests.value[i] = undefined as unknown as simulator._Simulator
  }

  model.Model.getModels(() => {
    topicModel.value = dbBridge._Model.model(dbBridge._Model.topicModelId())
    generateTopics()
  })
  simulator.Simulator.getSimulators()
})

const onSelectGuestClick = (index: number) => {
  selectingSimulator.value = true
  selectingSimulatorIndex.value = index
}

const onCancelSelectSimulatorClick = () => {
  selectingSimulator.value = false
}

const onSelectSimulatorClick = (_simulator: simulator._Simulator) => {
  selectingSimulator.value = false
  guests.value[selectingSimulatorIndex.value] = _simulator
}

const onSimulatorSelectorClose = () => {
  selectingSimulator.value = false
}

const onModelSelectorClose = () => {
  selectingModel.value = false
}

const onSelectModelClick = (_model: model._Model) => {
  selectingModel.value = false
  topicModel.value = _model
}

const onCancelSelectModelClick = () => {
  selectingModel.value = false
}

const _onSelectModelClick = () => {
  selectingModel.value = true
}

</script>

<stype lang='sass'>
.title
  font-size: 24px
  font-weight: 400
  color: gray

.plain-btn
  border: none !important
  background-color: transparent
  box-shadow: none !important
  padding: 0 !important

.plain-btn::after
  border: none !important
  content: none !important
</stype>
