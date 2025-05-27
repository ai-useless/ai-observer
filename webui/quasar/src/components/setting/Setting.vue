<template>
  <div class='full-height full-width'>
    <q-card class='full-height full-width'>
      <div class='row flex items-center q-px-md q-py-sm'>
        <div style='font-size: 16px;' class='text-grey-8'>
          设置
        </div>
        <q-space />
        <q-btn
          rounded
          flat
          icon='close'
          size='12px'
          color='grey-8'
          @click='onCloseClick'
          style='width: 12px;'
        />
      </div>
      <q-separator />
      <q-layout view='hHh Lpr lFf' container style='width: 800px; max-width: 100%; height: 600px'>
        <q-drawer
          class='bg-grey-2'
          show-if-above
          v-model='collapsed'
          :breakpoint='400'
          :width='160'
        >
          <SettingSideBar />
        </q-drawer>
        <q-separator vertical />
        <q-page-container>
          <q-page style='height: 1px;'>
            <q-tab-panels v-model='settingMenu' animated style='max-width: 100%; width: 640px;' class='full-height'>
              <q-tab-panel name='settings' class='full-width'>
                <Settings />
              </q-tab-panel>
              <q-tab-panel name='person'>
                <User />
              </q-tab-panel>
              <q-tab-panel name='createSimulator'>
                <CookSimulator />
              </q-tab-panel>
              <q-tab-panel name='mySimulators'>
                <MySimulators />
              </q-tab-panel>
              <q-tab-panel name='allSimulators'>
                <AllSimulators />
              </q-tab-panel>
              <q-tab-panel name='reviewSimulators'>
                <ReviewSimulators />
              </q-tab-panel>
              <q-tab-panel name='models'>
                <Models />
              </q-tab-panel>
            </q-tab-panels>
          </q-page>
        </q-page-container>
      </q-layout>
    </q-card>
  </div>
</template>

<script setup lang='ts'>
import { setting } from '../../localstores'
import { computed, ref } from 'vue'

import SettingSideBar from '../sidebar/SettingSideBar.vue'
import Settings from './Settings.vue'
import User from './User.vue'
import CookSimulator from '../simulator/CookSimulator.vue'
import MySimulators from '../simulator/MySimulators.vue'
import AllSimulators from '../simulator/AllSimulators.vue'
import Models from '../model/Models.vue'
import ReviewSimulators from '../simulator/ReviewSimulators.vue'

const settingMenu = computed(() => setting.Setting.currentSettingMenu())

const collapsed = ref(true)

const onCloseClick = () => {
  setting.Setting.setShowSetting(false)
}

</script>
