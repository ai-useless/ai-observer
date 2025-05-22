<template>
  <div class='column flex no-wrap fit'>
    <q-list>
      <q-item clickable v-ripple @click='onMenuClick("settings")' :class='[ settingMenu === "settings" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='settings' />
        </q-item-section>
        <q-item-section>系统设置</q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-ripple @click='onMenuClick("person")' :class='[ settingMenu === "person" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='person' />
        </q-item-section>
        <q-item-section>个人中心</q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-ripple @click='onMenuClick("createSimulator")' :class='[ settingMenu === "createSimulator" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='add' />
        </q-item-section>
        <q-item-section>创建模拟器</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click='onMenuClick("mySimulators")' :class='[ settingMenu === "mySimulators" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='account_circle' />
        </q-item-section>
        <q-item-section>我的模拟器</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click='onMenuClick("allSimulators")' :class='[ settingMenu === "allSimulators" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='apps' />
        </q-item-section>
        <q-item-section>全部模拟器</q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-ripple @click='onMenuClick("models")' :class='[ settingMenu === "models" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='web_asset' />
        </q-item-section>
        <q-item-section>模型</q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue'
import { setting } from 'src/localstores'

const settingMenu = computed(() => setting.Setting.currentSettingMenu().length ? setting.Setting.currentSettingMenu() : 'settings')

const onMenuClick = (_menu: string) => {
  setting.Setting.setCurrentSettingMenu(_menu)
}

</script>

<style scoped lang='sass'>
.selected
  border-right: 4px solid $blue-2
  color: $blue-6
</style>
