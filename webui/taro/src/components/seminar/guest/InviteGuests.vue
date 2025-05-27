<template>
  <View>
    <View style='font-size: 12px; color: gray;'>讨论主题</View>
    <Input :value='topic' style='border: 1px solid lightgray; border-radius: 4px; width: calc(100% - 48px); padding: 4px 8px; margin-top: 8px;' @input='onTopicInput' />
    <View style='display: flex; margin-top: 16px;'>
      <View style='font-size: 12px; color: gray;'>选择讨论阵容或</View>
      <View style='font-size: 12px; color: blue;' @click='onRandomGuestClick'>随机</View>
    </View>
    <View style='margin-top: 8px;'>
      <View v-for='(guest, index) in guests' :key='index' style='padding: 8px 0; border-bottom: 1px solid gray; width: calc(100% - 32px);'>
        <View v-if='!guest || !_models[index]' style='display: flex; align-items: center;'>
          <View style='text-align: center;'>
            <Image :src='personCircle' style='width: 48px; height: 48px;' />
            <View v-if='index === 0' style='font-size: 12px; color: gray;'>主持人</View>
          </View>
          <View style='font-size: 12px; color: blue; margin-left: 16px;' @click='onSelectGuestClick(index)'>{{ index === 0 ? '点击选择主持人' : '点击选择嘉宾' }}</View>
        </View>
        <View v-else @click='onSelectGuestClick(index)'>
          <GuestCard :simulator='guest' :role='index === 0 ? "主持人" : ""' :model='_models[index]' v-model:playing='playing' />
        </View>
      </View>
    </View>
    <Button
      @click='onStartDiscussClick'
      size='mini'
      :style='{ width: "calc(100% - 32px)", marginTop: "16px", borderRadius: "8px", color: ready ? "blue" : "gray" }'
      :disabled='!ready'
    >
      开始讨论
    </Button>
    <Button
      @click='onGotoOtherClick'
      size='mini'
      :style='{ width: "calc(100% - 32px)", borderRadius: "8px", color: "blue", marginBottom: "24px" }'
    >
      去其他栏目看看
    </Button>
  </View>
  <AtModal :is-opened='selectingSimulator' @close='onSimulatorSelectorClose'>
    <AtModalHeader>选择{{ selectingSimulatorIndex === 0 ? '主持人' : '嘉宾' }}模拟器</AtModalHeader>
    <AtModalContent>
      <View>
        <View v-for='(_simulator, index) in simulators' :key='index' style='border-bottom: 1px solid gray;' @click='onSelectSimulatorClick(_simulator)'>
          <SimulatorCard :simulator='_simulator' v-model:playing='playing' />
        </View>
      </View>
    </AtModalContent>
    <AtModalAction>
      <Button @click='onCancelSelectSimulatorClick'>取消</Button>
    </AtModalAction>
  </AtModal>
  <AtModal :is-opened='selectingModel' @close='onModelSelectorClose'>
    <AtModalHeader>选择{{ selectingSimulatorIndex === 0 ? '主持人' : '嘉宾' }}模型</AtModalHeader>
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
import { model, seminar, setting, simulator } from 'src/localstores'
import { View, Button, Image } from '@tarojs/components'
import { dbBridge } from 'src/bridge'
import { uuid } from 'src/utils'
import { dbModel } from 'src/model'

import { personCircle } from 'src/assets'

import SimulatorCard from '../../simulator/SimulatorCard.vue'
import ModelCard from '../../model/ModelCard.vue'
import GuestCard from './GuestCard.vue'

const selectingSimulatorIndex = ref(0)
const selectingSimulator = ref(false)
const selectingModel = ref(false)
const guests = ref([] as simulator._Simulator[])
const _models = ref([] as model._Model[])
const ready = computed(() => guests.value.findIndex((el) => !el) < 0 && _models.value.findIndex((el) => !el) < 0 && topic.value && topic.value.length)

const playing = ref(false)

const models = computed(() => model.Model.models())
const simulators = computed(() => simulator.Simulator.allSimulators().filter((el) => guests.value.findIndex((_el) => _el && _el.simulator === el.simulator) < 0))

const topic = computed(() => seminar.Seminar.topic())

const startSeminar = () => {
  const _uid = uuid.newUuid()
  const participators = guests.value.map((el, index) => {
    return {
      id: index,
      simulatorId: el.id,
      seminarUid: _uid,
      role: index === 0 ? dbModel.Role.HOST : dbModel.Role.GUEST,
      modelId: _models.value[index].id
    }
  }) as dbModel.Participator[]

  // TODO: check if it's a valid topic
  dbBridge._Seminar.create(_uid, topic.value, participators)
  seminar.Seminar.setSeminar(_uid)
  setting.Setting.setTabIndex(1)
  Taro.switchTab({ url: '/pages/seminar/SeminarPage' })
}

const onStartDiscussClick = () => {
  startSeminar()
}

const onGotoOtherClick = () => {
  Taro.switchTab({ url: '/pages/index/IndexPage' })
}

const randomSelect = () => {
  for (let i = 0; i < guests.value.length; i++) {
    guests.value[i] = undefined as unknown as simulator._Simulator
    _models.value[i] = undefined as unknown as model._Model
  }
  for (let i = 0; i < guests.value.length; i++) {
    while (true) {
      let _simulator = dbBridge._Simulator.randomPeek(i === 0 ? true : undefined)
      if (!_simulator) _simulator = dbBridge._Simulator.randomPeek()
      if (guests.value.findIndex((el) => el && el.simulator === _simulator.simulator) >= 0) continue
      guests.value[i] = _simulator
      let _model = dbBridge._Model.randomPeek(i === 0 ? true : undefined)
      if (!_model) _model = dbBridge._Model.randomPeek()
      _models.value[i] = _model
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
  const count = Math.floor(Math.random() * 3) + 4
  for (let i = 0; i < count; i++) {
    guests.value.push(undefined as unknown as simulator._Simulator)
    _models.value.push(undefined as unknown as model._Model)
  }
  model.Model.getModels()
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
  selectingModel.value = true
}

const onSimulatorSelectorClose = () => {
  selectingSimulator.value = false
}

const onModelSelectorClose = () => {
  selectingModel.value = false
}

const onSelectModelClick = (_model: model._Model) => {
  selectingModel.value = false
  _models.value[selectingSimulatorIndex.value] = _model
}

const onCancelSelectModelClick = () => {
  selectingModel.value = false
}

const onTopicInput = (e: { detail: { value: string } }) => {
  seminar.Seminar.setTopic(e.detail.value)
}

</script>
