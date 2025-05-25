<template>
  <div class='row q-pb-md'>
    <q-avatar size='56px'>
      <q-img :src='_simulator.simulator_avatar_url' />
    </q-avatar>
    <q-item-label class='q-ml-md' style='width: calc(100% - 56px - 16px);'>
      <div class='row flex items-center'>
        <div class='text-bold text-grey-9 q-pr-xs'>
          {{ _simulator.simulator }}
        </div>
        <div class='text-grey-6 single-line-nowrap q-mr-xs' style='font-size: 12px; max-width: 120px;'>
          {{ _simulator.title }}
        </div>
        <q-btn
          flat
          dense
          class='text-blue-4 q-mr-xs q-py-none q-px-none'
          style='font-size: 12px;'
          @click.stop='onPlayClick'
        >
          试听
        </q-btn>
        <q-btn
          v-if='showLanguage'
          flat
          dense
          :class='[ canSetLanguage ? "text-blue-4" : "text-grey-6", "q-py-none q-px-none" ]'
          style='font-size: 12px;'
          @click.stop='onSelectLanguageClick'
        >
          {{ _simulator.language }}
        </q-btn>
        <q-space />
        <q-btn
          v-if='showActions'
          flat
          dense
          rounded
          icon='more_vert'
          color='grey-5'
          class='q-mr-sm'
        >
          <q-menu self='top right' anchor='bottom end'>
            <q-list>
              <q-item
                v-if='enableActionReview'
                dense
                clickable v-close-popup
                @click='onReviewClick'
              >
                <q-item-section>审核</q-item-section>
              </q-item>
              <q-item
                v-if='enableActionReport'
                dense
                clickable
                v-close-popup
                @click='onReportClick'
              >
                <q-item-section>举报</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
      <div v-if='!simple' class='q-mt-xs text-grey-6' style='font-size: 12px;'>
        {{ _simulator.origin_personality }}
      </div>
    </q-item-label>
  </div>
  <q-dialog v-model='selectingLanguage'>
    <div>
      <LanguageSelector v-model:selected='selectedLanguage' @cancel='onCancelSelectLanguage' @selected='onLanguageSelected' />
    </div>
  </q-dialog>
</template>

<script setup lang='ts'>
import { simulator } from 'src/localstores'
import { AudioPlayer } from 'src/player'
import { defineProps, ref, toRef, withDefaults } from 'vue'

import LanguageSelector from '../selector/LanguageSelector.vue'

interface Props {
  simulator: simulator._Simulator
  canSetLanguage?: boolean
  simple?: boolean
  showActions?: boolean
  showLanguage?: boolean
  enableActionReport?: boolean
  enableActionReview?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  showLanguage: true
})
const _simulator = toRef(props, 'simulator')
const canSetLanguage = toRef(props, 'canSetLanguage')
const simple = toRef(props, 'simple')
const showActions = toRef(props, 'showActions')
const showLanguage = toRef(props, 'showLanguage')
const enableActionReport = toRef(props, 'enableActionReport')
const enableActionReview = toRef(props, 'enableActionReview')

const selectingLanguage = ref(false)
const selectedLanguage = ref(_simulator.value.language)

const onPlayClick = async () => {
  await AudioPlayer.play(_simulator.value.audio_url)
}

const onCancelSelectLanguage = () => {
  selectingLanguage.value = false
}

const onLanguageSelected = (_language: string) => {
  selectingLanguage.value = false
  _simulator.value.language = _language
}

const onSelectLanguageClick = () => {
  selectingLanguage.value = true
}

const onReviewClick = () => {
  // TODO
}

const onReportClick = () => {
  // TODO
}

</script>
