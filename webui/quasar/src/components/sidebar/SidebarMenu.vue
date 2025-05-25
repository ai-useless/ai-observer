<template>
  <div class='column flex no-wrap fit'>
    <q-list>
      <q-item style='height: 64px;' class='bg-gradient-blue text-white' clickable @click='onLogoClick'>
        <q-item-section avatar>
          <div class='row'>
            <q-avatar>
              <q-img :src='meipuAgiLogo' />
            </q-avatar>
            <q-item-label v-if='!collapsed' class='text-subtitle1 text-bold flex items-center q-ml-sm'>
              <span>没谱儿AGI</span>
            </q-item-label>
          </div>
        </q-item-section>
        <q-space v-if='!collapsed' />
        <q-item-section v-if='!collapsed' side class='q-pr-none'>
          <q-btn
            flat
            rounded
            dense
            :icon='collapsed ? "menu_open" : "menu"'
            @click.stop='collapsed = !collapsed'
            color='white'
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
      <q-item clickable v-ripple @click='onMenuClick("search")' :class='[ menu === "search" ? "selected" : "" ]'>
        <q-item-section avatar>
          <q-icon name='search' />
        </q-item-section>
        <q-item-section>问一问</q-item-section>
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
      <q-item clickable v-ripple @click='onMenuClick("meme")' :class='[ menu === "meme" ? "selected" : "" ]'>
        <q-item-section avatar>
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
      <q-item clickable v-ripple @click='onSettingClick("createSimulator")'>
        <q-item-section avatar>
          <q-icon name='add' />
        </q-item-section>
        <q-item-section>创建模拟器</q-item-section>
      </q-item>
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name='help' />
        </q-item-section>
        <q-item-section>帮助</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click='onSettingClick("settings")'>
        <q-item-section avatar>
          <q-icon name='settings' />
        </q-item-section>
        <q-item-section>设置</q-item-section>
      </q-item>
      <q-separator />
      <q-item
        v-if='logined'
        clickable
        v-ripple
        @click='onSettingClick("person")'
        style='border-radius: 16px; margin: 8px;'
        class='bg-gradient-blue text-white'
      >
        <q-item-section avatar>
          <q-avatar :size='collapsed ? "24px" : "48px"'>
            <q-img :src='avatarUrl' />
          </q-avatar>
        </q-item-section>
        <q-item-section class='text-bold'>
          {{ username }}
        </q-item-section>
      </q-item>
      <q-item
        v-else
        clickable
        v-ripple
        @click='onLoginClick'
        style='border-radius: 16px; margin: 8px;'
        class='bg-gradient-blue text-white'
      >
        <q-item-section avatar>
          <q-icon name='login' />
        </q-item-section>
        <q-item-section>登录</q-item-section>
      </q-item>
    </q-list>
  </div>
  <q-dialog v-model='showSetting'>
    <div style='max-width: 800px; max-height: 80vh;'>
      <Setting />
    </div>
  </q-dialog>
</template>

<script setup lang='ts'>
import { computed, defineModel, onMounted } from 'vue'
import { setting, user } from 'src/localstores'
import { useRouter } from 'vue-router'

import Setting from '../setting/Setting.vue'

import { meipuAgiLogo } from 'src/assets'

const collapsed = defineModel<boolean>('collapsed')
const menu = computed(() => setting.Setting.currentMenu().length ? setting.Setting.currentMenu() : 'home')

const router = useRouter()

const username = computed(() => user.User.username())
const avatarUrl = computed(() => user.User.avatarUrl())
const logined = computed(() => user.User.logined())

const onMenuClick = (_menu: string) => {
  setting.Setting.setCurrentMenu(_menu)

  switch (_menu) {
    case 'home': void router.push({ path: '/' }); break
    case 'observer': void router.push({ path: '/seminar/guests' }); break
    case 'xiangsheng': void router.push({ path: '/xiangsheng/roles' }); break
    case 'duanzi': void router.push({ path: '/duanzi' }); break
    case 'meme': void router.push({ path: '/meme' }); break
    case 'chat': void router.push({ path: '/chat' }); break
    case 'english': void router.push({ path: '/english' }); break
    case 'nianjing': void router.push({ path: '/nianjing' }); break
    case 'search': void router.push({ path: '/search' }); break
    case 'post': void router.push({ path: '/post' }); break
  }
}

const onLogoClick = () => {
  if (collapsed.value) {
    collapsed.value = false
  } else {
    onMenuClick('home')
  }
}

const onLoginClick = () => {
  void router.push({ path: '/wechat/login' })
}

const onSettingClick = (_menu: string) => {
  setting.Setting.setCurrentSettingMenu(_menu)
  setting.Setting.setShowSetting(true)
}

const showSetting = computed({
  get: () => setting.Setting.showSetting(),
  set: (v: boolean) => {
    setting.Setting.setShowSetting(v)
  }
})

onMounted(() => {
  user.User.getUser()
})

</script>

<style scoped lang='sass'>
.selected
  border-right: 4px solid $blue-4
  color: $blue-6
</style>
