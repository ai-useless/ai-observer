<template>
  <div class='column flex no-wrap fit'>
    <q-list>
      <q-item style='height: 64px;'>
        <q-item-section v-if='!collapsed' avatar>
          <div class='row' @click='onMenuClick("home")'>
            <q-avatar>
              <q-img :src='meipuAgiLogo' />
            </q-avatar>
            <q-item-label class='text-subtitle1 text-bold text-grey-9 flex items-center q-ml-sm'>
              <span>没谱儿AGI</span>
            </q-item-label>
          </div>
        </q-item-section>
        <q-space v-if='!collapsed' />
        <q-item-section side class='q-pr-none'>
          <q-btn
            flat
            rounded
            dense
            :icon='collapsed ? "menu_open" : "menu"'
            @click='collapsed = !collapsed'
          />
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-ripple @click='onMenuClick("home")' :class='[ menu === "home" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='home' />
        </q-item-section>
        <q-item-section>首页</q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-ripple @click='onMenuClick("observer")' :class='[ menu === "observer" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='public' />
        </q-item-section>
        <q-item-section>看世界</q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-ripple @click='onMenuClick("xiangsheng")' :class='[ menu === "xiangsheng" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='child_care' />
        </q-item-section>
        <q-item-section>相声社</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click='onMenuClick("duanzi")' :class='[ menu === "duanzi" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='mood' />
        </q-item-section>
        <q-item-section>有内涵</q-item-section>
      </q-item>
      <q-item clickable v-ripple>
        <q-item-section avatar @click='onMenuClick("meme")' :class='[ menu === "meme" ? "selected" : "" ]'>
          <q-icon name='sentiment_satisfied' />
        </q-item-section>
        <q-item-section>超有梗</q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-ripple @click='onMenuClick("chat")' :class='[ menu === "chat" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='chat' />
        </q-item-section>
        <q-item-section>轻松聊</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click='onMenuClick("post")' :class='[ menu === "post" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='wysiwyg' />
        </q-item-section>
        <q-item-section>超有才</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click='onMenuClick("nianjing")' :class='[ menu === "nianjing" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='psychology' />
        </q-item-section>
        <q-item-section>妙音坊</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click='onMenuClick("english")' :class='[ menu === "english" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='local_library' />
        </q-item-section>
        <q-item-section>英语角</q-item-section>
      </q-item>
    </q-list>

    <div class='q-mt-auto' />

    <q-list separator>
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name='help' />
        </q-item-section>
        <q-item-section>帮助</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click='onMenuClick("settings")'>
        <q-item-section avatar>
          <q-icon name='settings' />
        </q-item-section>
        <q-item-section>设置</q-item-section>
      </q-item>
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name='logout' />
        </q-item-section>
        <q-item-section>退出登录</q-item-section>
      </q-item>
    </q-list>
  </div>
  <q-dialog v-model='showSetting'>
    <Setting />
  </q-dialog>
</template>

<script setup lang='ts'>
import { computed, defineModel } from 'vue'
import { setting } from 'src/localstores'
import { useRouter } from 'vue-router'

import Setting from '../setting/Setting.vue'

import { meipuAgiLogo } from 'src/assets'

const collapsed = defineModel<boolean>('collapsed')
const menu = computed(() => setting.Setting.currentMenu().length ? setting.Setting.currentMenu() : 'home')

const router = useRouter()

const onMenuClick = (_menu: string) => {
  setting.Setting.setCurrentMenu(_menu)

  switch (_menu) {
    case 'home': void router.push({ path: '/' }); break
    case 'observer': void router.push({ path: '/seminar/guests' }); break
    case 'xiangsheng': void router.push({ path: '/xiangsheng/roles' }); break
    case 'settings': setting.Setting.setShowSetting(true); break
  }
}

const showSetting = computed({
  get: () => setting.Setting.showSetting(),
  set: (v: boolean) => {
    setting.Setting.setShowSetting(v)
  }
})

</script>

<style scoped lang='sass'>
.selected
  border-right: 4px solid $blue-2
  color: $blue-6
</style>
