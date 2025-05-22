<template>
  <div style='max-width: 960px;'>
    <q-card class='bg-gradient-blue no-border-radius'>
      <q-card-section>
        <div class='flex justify-center items-center' style='height: 240px;'>
          <div class='text-center'>
            <div class='text-white text-bold' style='font-size: 40px;'>
              {{ topic }}
            </div>
            <div class='text-white' style='font-size: 16px;'>
              选择您喜欢的AGI模拟器讨论您感兴趣的话题~
            </div>
            <q-btn
              class='action-btn text-grey-9 q-mt-lg border-gradient-bg-white full-width border-radius-16px'
              flat
              dense
              @click='onStartSeminarClick'
              :disabled='!ready'
            >
              开始讨论
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
    <div>
      <div class='row items-center'>
        <div class='bg-gradient-blue' style='height: 4px; width: 48px;' />
        <h4 class='q-ml-md text-grey-9'>
          主持人
        </h4>
        <q-space />
        <q-btn
          class='text-blue-6'
          rounded
          flat
          dense
          @click='onChangeTopicClick'
        >
          换个话题
        </q-btn>
        <q-btn
          class='text-blue-6'
          rounded
          flat
          dense
          @click='onRandomSelectClick'
        >
          随机安排
        </q-btn>
      </div>
      <div @click='onParticipatorClick(0)'>
        <GuestCardHorizontal
          :participator='host'
          :role='dbModel.Role.HOST'
        />
      </div>
    </div>
    <div class='q-mb-lg'>
      <div class='flex items-center'>
        <div class='bg-gradient-blue' style='height: 4px; width: 48px;' />
        <h4 class='q-ml-md text-grey-9'>
          嘉宾
        </h4>
      </div>
      <div class='row q-col-gutter-md'>
        <div
          v-for='(guest, index) of guests'
          :key='index'
          class='col-12 col-sm-6 col-md-4'
          @click='onParticipatorClick(index + 1)'
        >
          <GuestCardVertical
            :participator='guest'
            :role='dbModel.Role.GUEST'
          />
        </div>
      </div>
    </div>
  </div>
  <q-dialog v-model='selectingSimulator'>
    <div>
      <SimulatorSelector v-model:selected='selectedSimulator' @cancel='onCancelSelectSimulator' @selected='onSimulatorSelected' :hide-ids='selectedSimulatorIds' />
    </div>
  </q-dialog>
</template>

<script setup lang='ts'>
import { model, seminar, setting, simulator } from 'src/localstores'
import { computed, onMounted, ref } from 'vue'
import { dbModel } from 'src/model'
import { useRouter } from 'vue-router'
import { dbBridge } from 'src/bridge'
import { v4 as uuidv4 } from 'uuid'

import GuestCardVertical from './GuestCardVertical.vue'
import GuestCardHorizontal from './GuestCardHorizontal.vue'
import SimulatorSelector from '../selector/SimulatorSelector.vue'

const participatorCount = ref(7)
const participators = ref([] as dbModel.Participator[])

const host = computed(() => participators.value[0])
const guests = computed(() => participators.value.slice(1))
const topic = computed(() => seminar.Seminar.topic())
const _uid = computed(() => seminar.Seminar.seminar())

const router = useRouter()

const selectingSimulator = ref(false)
const selectingIndex = ref(0)
const selectedSimulator = ref(undefined as unknown as simulator._Simulator)

const selectedSimulatorIds = computed(() => participators.value.filter((el) => el).map((el) => el.simulatorId))
const ready = computed(() => {
  return topic.value?.length && participators.value.findIndex((el) => !el) < 0
})

onMounted(() => {
  setting.Setting.setCurrentMenu('observer')

  if (!topic.value || !topic.value.length) {
    void router.push({ path: '/' })
    return
  }

  participatorCount.value = Math.floor(Math.random() * 4) + 6
  for (let i = 0; i < participatorCount.value; i++) {
    participators.value.push(undefined as unknown as dbModel.Participator)
  }

  simulator.Simulator.getSimulators()
  model.Model.getModels()
})

const onStartSeminarClick = async () => {
  await dbBridge._Seminar.create(_uid.value, topic.value, [...participators.value])
  void router.push({ path: '/seminar' })
}

const randomSelect = async () => {
  const _uid = uuidv4()
  seminar.Seminar.setSeminar(_uid)

  for (let i = 0; i < participators.value.length; i++) {
    participators.value[i] = undefined as unknown as dbModel.Participator
  }
  for (let i = 0; i < participators.value.length; i++) {
    while (true) {
      let _simulator = await dbBridge._Simulator.randomPeek(i === 0 ? true : undefined)
      if (!_simulator) _simulator = await dbBridge._Simulator.randomPeek()
      if (participators.value.findIndex((el) => el && el.simulatorId === _simulator.id) >= 0) continue
      let _model = await dbBridge._Model.randomPeek(i === 0 ? true : undefined)
      if (!_model) _model = await dbBridge._Model.randomPeek()
      participators.value[i] = {
        seminarUid: _uid,
        role: i === 0 ? dbModel.Role.HOST : dbModel.Role.GUEST,
        simulatorId: _simulator.id,
        modelId: _model.id
      } as dbModel.Participator
      break
    }
  }
}

const onRandomSelectClick = async () => {
  await randomSelect()
}

const onChangeTopicClick = () => {
  setting.Setting.setCurrentMenu('home')
  void router.push({ path: '/' })
}

const onParticipatorClick = (index: number) => {
  selectingSimulator.value = true
  selectingIndex.value = index
}

const onCancelSelectSimulator = () => {
  selectingSimulator.value = false
}

const onSimulatorSelected = (_simulator: simulator._Simulator) => {
  selectingSimulator.value = false

  participators.value[selectingIndex.value] = participators.value[selectingIndex.value] ? {
    ...participators.value[selectingIndex.value],
    simulatorId: _simulator.id
  } : {
    simulatorId: _simulator.id
  } as dbModel.Participator
}

</script>
