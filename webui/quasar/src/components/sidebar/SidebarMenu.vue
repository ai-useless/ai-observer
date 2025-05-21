<template>
  <div class='column flex no-wrap fit'>
    <q-list>
      <q-item style='height: 64px;'>
        <q-item-section v-if='!collapsed' avatar>
          <div class='row'>
            <q-avatar>
              <q-img :src='meipuAgiLogo' />
            </q-avatar>
            <q-item-label class='text-subtitle1 text-bold text-grey-9 flex items-center q-ml-sm'>
              <span>没谱儿AGI</span>
            </q-item-label>
          </div>
        </q-item-section>
        <q-space v-if='!collapsed' />
        <q-item-section side>
          <q-btn
            flat
            round
            dense
            :icon='collapsed ? "menu_open" : "menu"'
            @click='collapsed = !collapsed'
          />
        </q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-ripple>
        <q-item-section avatar class='q-w-xs'>
          <q-icon name='home' />
        </q-item-section>
        <q-item-section>首页</q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name='public' />
        </q-item-section>
        <q-item-section>看世界</q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name='child_care' />
        </q-item-section>
        <q-item-section>相声社</q-item-section>
      </q-item>
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name='mood' />
        </q-item-section>
        <q-item-section>有内涵</q-item-section>
      </q-item>
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name='sentiment_satisfied' />
        </q-item-section>
        <q-item-section>超有梗</q-item-section>
      </q-item>
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name='sentiment_neutral' />
        </q-item-section>
        <q-item-section>造Meme</q-item-section>
      </q-item>
      <q-separator />
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name='chat' />
        </q-item-section>
        <q-item-section>轻松聊</q-item-section>
      </q-item>
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name='wysiwyg' />
        </q-item-section>
        <q-item-section>超有才</q-item-section>
      </q-item>
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name='psychology' />
        </q-item-section>
        <q-item-section>妙音坊</q-item-section>
      </q-item>
      <q-item clickable v-ripple>
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
      <q-item clickable v-ripple>
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
</template>

<script setup lang='ts'>
import { defineModel } from 'vue'

import { meipuAgiLogo } from 'src/assets'

const collapsed = defineModel<boolean>('collapsed')

</script>
