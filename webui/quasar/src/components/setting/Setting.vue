<template>
  <div>
    <q-card style='width: 90vw; max-width: 600px; max-height: 80vh;'>
      <div class='row flex items-center q-px-md q-py-sm'>
        <div style='font-size: 16px; width: calc(100% - 64px);' class='text-grey-8'>
          设置
        </div>
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
      <div class='row'>
        <div style='width: 160px' class='bg-grey-2'>
          <SettingSideBar />
        </div>
        <q-separator vertical />
        <q-tab-panels v-model='settingMenu' animated style='width: calc(100% - 196px);'>
          <q-tab-panel name='settings' class='full-width'>
            <Settings />
          </q-tab-panel>
          <q-tab-panel name='person'>
            TBD
          </q-tab-panel>
          <q-tab-panel name='createSimulator'>
            TBD
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

const settingMenu = computed(() => setting.Setting.currentSettingMenu())

const onCloseClick = () => {
  setting.Setting.setShowSetting(false)
}

</script>
