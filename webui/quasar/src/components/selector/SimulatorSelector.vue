<template>
  <div class='full-width'>
    <q-card class='q-pb-sm border-radius-16px' :style='{ maxWidth: "90%", width: `${width}px` }'>
      <q-card-section class='text-grey-9'>
        <div class='text-h6 text-center'>
          {{ title }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-input
          rounded
          dense
          v-model='simulatorSearch'
          placeholder='搜索模拟器...'
          outlined
        >
          <template #prepend>
            <q-icon name='search' size='24px' />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section dense :style='{ height: `${listHeight}px`, maxHeight: "90%" }' class='q-pa-none q-pb-md'>
        <q-scroll-area class='fit'>
          <q-list>
            <q-item
              v-for='(_simulator, index) in filteredSimulators'
              :key='index'
              clickable
              @click='selectSimulator(_simulator)'
              :active='selectedSimulator === _simulator'
              active-class='text-blue-2'
              class='q-px-lg'
            >
              <q-item-section>
                <SimulatorCard :simulator='_simulator' :simple='simple' :can-set-language='canSetLanguage' />
              </q-item-section>
              <q-item-section side>
                <q-icon
                  name='check'
                  :color='selectedSimulator?.simulator === _simulator.simulator ? "primary" : "transparent"'
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-card-section>

      <q-separator v-if='showActionBtn' />

      <q-card-actions v-if='showActionBtn' align='right'>
        <q-btn
          label='取消'
          class='full-width border-gradient-bg-white text-grey-9'
          flat
          rounded
          @click='onCancelClick'
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup lang='ts'>
import { dbBridge } from 'src/bridge'
import { simulator } from 'src/localstores'
import { computed, onMounted, ref, defineModel, defineEmits, toRef, defineProps, withDefaults } from 'vue'

import SimulatorCard from '../simulator/SimulatorCard.vue'

interface Props {
  title?: string
  hideIds?: number[]
  showActionBtn?: boolean
  width?: number
  listHeight?: number
  simple?: boolean
  canSetLanguage?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  title: '选择模拟器',
  width: 400,
  hideIds: () => [] as number[],
  listHeight: 250
})
const title = toRef(props, 'title')
const width = toRef(props, 'width')
const showActionBtn = toRef(props, 'showActionBtn')
const hideIds = toRef(props, 'hideIds')
const simple = toRef(props, 'simple')
const canSetLanguage = toRef(props, 'canSetLanguage')

const simulators = ref([] as simulator._Simulator[])
const selectedSimulator = defineModel<simulator._Simulator>('selected')
const simulatorSearch = ref('')

const displaySimulators = computed(() => simulators.value.filter((el) => !hideIds.value.length || !hideIds.value.includes(el.id)))

const filteredSimulators = computed(() => {
  if (!simulatorSearch.value?.length) {
    return displaySimulators.value
  }
  return displaySimulators.value.filter(simulator =>
    simulator.simulator.toLowerCase().includes(simulatorSearch.value.toLowerCase()) ||
    simulator.title.toLowerCase().includes(simulatorSearch.value.toLowerCase()) ||
    simulator.origin_personality.toLowerCase().includes(simulatorSearch.value.toLowerCase())
  )
})

const emit = defineEmits<{(ev: 'selected', simulator: simulator._Simulator): void,
  (ev: 'cancel'): void
}>()

const selectSimulator = (simulator: simulator._Simulator) => {
  selectedSimulator.value = simulator
  emit('selected', simulator)
}

const onCancelClick = () => {
  emit('cancel')
}

onMounted(async () => {
  simulators.value = await dbBridge._Simulator.allSimulators()
})

</script>
