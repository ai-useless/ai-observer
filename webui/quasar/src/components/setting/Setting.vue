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
      <div class='row full-width'>
        <div style='width: 160px; height: 400px;' class='bg-grey-2'>
          <SettingSideBar />
        </div>
        <q-separator vertical />
        <q-tab-panels v-model='settingMenu' animated style='max-width: calc(100% - 196px); min-width: 440px;'>
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
            TBD
          </q-tab-panel>
          <q-tab-panel name='allSimulators'>
            TBD
          </q-tab-panel>
          <q-tab-panel name='models'>
            TBD
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </q-card>
  </div>
</template>

<script setup lang='ts'>
import { setting } from 'src/localstores'
import { computed } from 'vue'

import SettingSideBar from '../sidebar/SettingSideBar.vue'
import Settings from './Settings.vue'
import User from './User.vue'
import CookSimulator from '../simulator/CookSimulator.vue'

const settingMenu = computed(() => setting.Setting.currentSettingMenu())

const onCloseClick = () => {
  setting.Setting.setShowSetting(false)
}

</script>
