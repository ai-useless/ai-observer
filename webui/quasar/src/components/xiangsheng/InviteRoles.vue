<template>
  <div :style='{ maxWidth: "100%", width: "800px", height: `${contentHeight}px` }'>
    <div style='height: calc(100% - 64px); overflow: scroll;' class='full-width hide-scrollbar'>
      <q-card class='bg-gradient-blue no-border-radius'>
        <q-card-section>
          <div class='flex justify-center items-center' style='height: 160px;'>
            <div class='text-center'>
              <div class='text-white text-bold' style='font-size: 28px;'>
                {{ topic }}
              </div>
              <div class='text-white' style='font-size: 16px;'>
                选择您喜欢的AGI模拟器表演相声~
                <q-icon name='help' size='20px' class='text-gray-6 cursor-pointer q-ml-xs'>
                  <q-tooltip style='font-size: 14px;'>
                    您知道吗：这里的相声都是AGI实时生成的，您可以定制相声的风格并选择喜欢的模拟器为您表演。
                  </q-tooltip>
                </q-icon>
              </div>
              <q-btn
                class='action-btn text-grey-9 q-mt-lg border-gradient-bg-white full-width border-radius-16px'
                flat
                dense
                @click='onStartXiangshengClick'
                :disabled='!ready'
              >
                开始表演
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
      <div class='q-px-sm'>
        <div class='q-mb-lg'>
          <div class='flex items-center'>
            <div class='bg-gradient-blue' style='height: 4px; width: 48px;' />
            <h4 class='q-ml-md text-grey-9'>
              演员
            </h4>
            <q-space />
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
          <div class='row q-col-gutter-md'>
            <div
              v-for='(participator, index) of participators'
              :key='index'
              class='col-12 col-md-6'
              @click='onParticipatorClick(index)'
            >
              <RoleCardVertical
                :participator='participator'
                :role='index === 0 ? dbModel.Role.HOST : dbModel.Role.GUEST'
                v-model:playing='playing'
              />
            </div>
          </div>
        </div>
        <div style='margin-top: 48px; width: 100%;'>
          <div style='border-bottom: 1px solid gray;' class='row items-center'>
            <div style='color: gray;'>
              您可能对这些感兴趣
            </div>
            <q-icon name='help' size='20px' class='text-gray-6 cursor-pointer q-ml-xs'>
              <q-tooltip style='font-size: 14px;'>
                您知道吗：这些相声主题都是AGI实时生成的。
              </q-tooltip>
            </q-icon>
            <q-space />
            <q-btn
              label='换一批'
              color='blue'
              flat
              dense
              @click='onChangeTopicsClick'
              :loading='generating'
            />
          </div>
          <div style='margin-top: 8px;' />
          <div
            v-for='_topic in topics'
            :key='_topic'
            style='color: blue; font-size: 16px;' class='text-left cursor-pointer'
            @click='onTopicClick(_topic)'
          >
            {{ _topic }}
          </div>
        </div>
      </div>
    </div>
    <div class='flex justify-center items-center'>
      <BottomFixInput
        v-model='inputTopic'
        placeholder='请输入新的相声主题~'
        @enter='onTopicEnter'
        width='720px'
        max-width='calc(100% - 8px)'
      />
    </div>
  </div>
  <q-dialog v-model='selectingSimulator'>
    <div>
      <SimulatorSelector v-model:selected='selectedSimulator' @cancel='onCancelSelectSimulator' @selected='onSimulatorSelected' :hide-ids='selectedSimulatorIds' />
    </div>
  </q-dialog>
</template>

<script setup lang='ts'>
import { model, setting, simulator, xiangsheng } from 'src/localstores'
import { computed, onMounted, ref } from 'vue'
import { dbModel } from 'src/model'
import { useRouter } from 'vue-router'
import { dbBridge, entityBridge } from 'src/bridge'
import { v4 as uuidv4 } from 'uuid'
import { xiangshengWorker } from 'src/worker'

import RoleCardVertical from './RoleCardVertical.vue'
import SimulatorSelector from '../selector/SimulatorSelector.vue'
import BottomFixInput from '../input/BottomFixInput.vue'

const contentHeight = computed(() => setting.Setting.contentHeight())

const participatorCount = ref(2)
const participators = ref([] as dbModel.Participator[])

const topic = computed(() => xiangsheng.Xiangsheng.topic())
const inputTopic = ref('')
const _uid = computed(() => xiangsheng.Xiangsheng.xiangsheng())

const topics = ref([] as string[])
const historyTopics = ref([] as string[])
const generating = ref(false)

const router = useRouter()

const selectingSimulator = ref(false)
const selectingIndex = ref(0)
const selectedSimulator = ref(undefined as unknown as simulator._Simulator)

const selectedSimulatorIds = computed(() => participators.value.filter((el) => el).map((el) => el.simulatorId))
const ready = computed(() => {
  return topic.value?.length && participators.value.findIndex((el) => el.simulatorId === undefined || el.modelId === undefined) < 0
})

const playing = ref(false)

const initializeParticipators = async () => {
  const _uid = uuidv4()
  xiangsheng.Xiangsheng.setXiangsheng(_uid)
  participators.value = []

  for (let i = 0; i < participatorCount.value; i++) {
    participators.value.push({
      seminarUid: _uid,
      modelId: await dbBridge._Model.topicModelId(),
      role: i === 0 ? dbModel.Role.HOST : dbModel.Role.GUEST
    } as unknown as dbModel.Participator)
  }
}

onMounted(() => {
  const _uid = uuidv4()
  xiangsheng.Xiangsheng.setXiangsheng(_uid)
  setting.Setting.setCurrentMenu('xiangsheng')

  simulator.Simulator.getSimulators()
  model.Model.getModels(() => {
    onChangeTopicsClick()
    void initializeParticipators()
  })
})

const onStartXiangshengClick = async () => {
  await dbBridge._Xiangsheng.create(_uid.value, topic.value, [...participators.value], xiangshengWorker.Intent.GENERATE)
  void router.push({ path: '/xiangsheng' })
}

const randomSelect = async () => {
  await initializeParticipators()

  for (let i = 0; i < participators.value.length; i++) {
    while (true) {
      let _simulator = await dbBridge._Simulator.randomPeek(i === 0 ? true : undefined)
      if (!_simulator) _simulator = await dbBridge._Simulator.randomPeek()
      if (participators.value.findIndex((el) => el && el.simulatorId === _simulator.id) >= 0) continue
      participators.value[i] = {
        seminarUid: _uid.value,
        role: i === 0 ? dbModel.Role.HOST : dbModel.Role.GUEST,
        simulatorId: _simulator.id,
        modelId: await dbBridge._Model.topicModelId()
      } as dbModel.Participator
      break
    }
  }
  participators.value = [...participators.value]
}

const onRandomSelectClick = async () => {
  await randomSelect()
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

const onTopicEnter = (_topic: string) => {
  xiangsheng.Xiangsheng.setTopic(_topic)
  inputTopic.value = ''
}

const onChangeTopicsClick = () => {
  generating.value = true

  entityBridge.EXiangsheng.prepareTopics(historyTopics.value).then((payload) => {
    generating.value = false
    if (!payload?.topics?.length) return
    historyTopics.value.push(...topics.value)
    topics.value = payload.topics
    if (!topic.value?.length) xiangsheng.Xiangsheng.setTopic(topics.value[0])
  }).catch((e) => {
    generating.value = false
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed prepare topics: ${e}`)
  })
}

const onTopicClick = (_topic: string) => {
  xiangsheng.Xiangsheng.setTopic(_topic)
  if (ready.value) {
    onStartXiangshengClick()
  }
}

</script>
