<template>
  <div v-if='!username || !avatarUrl'>
    <q-btn
      flat
      dense
      rounded
      icon='logout'
      class='full-width border-gradient-bg-white text-grey-8'
      @click='onLoginClick'
    >
      扫码登录
    </q-btn>
  </div>
  <div v-else>
    <q-item dense clickable class='row cursor-pointer flex items-center border-radius-8px'>
      <div class='text-grey-8'>
        用户名
      </div>
      <q-space />
      <div style='height: 18px; border-radius: 4px;'>
        {{ username }}
      </div>
    </q-item>
    <q-item dense clickable class='row cursor-pointer flex items-center border-radius-8px q-py-xs'>
      <div class='text-grey-8'>
        头像
      </div>
      <q-space />
      <div style='border-radius: 4px;'>
        <q-avatar size='36px'>
          <q-img :src='avatarUrl' width='36px' height='36px' />
        </q-avatar>
      </div>
    </q-item>
    <q-item dense clickable class='row cursor-pointer flex items-center border-radius-8px'>
      <div class='text-grey-8'>
        订阅计划
      </div>
      <q-space />
      <div style='border-radius: 4px;' class='row'>
        <div>免费会员</div>
      </div>
    </q-item>
    <q-item dense clickable class='bg-grey-2 flex q-mt-sm q-py-sm border-radius-8px'>
      <div class='text-grey-8' style='font-size: 12px'>
        敬请关注：没谱儿AGI将在近期开放订阅套餐，提供高质量内容生成、数字人、视频生成、一键分享、存储计划、栏目预约等高级功能，敬请期待！
      </div>
      <q-space />
    </q-item>
    <div class='q-mx-md q-mt-md'>
      <q-btn
        flat
        dense
        rounded
        icon='logout'
        class='full-width border-gradient-bg-white text-grey-8'
        @click='onLogoutClick'
      >
        退出登录
      </q-btn>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { Cookies } from 'quasar'
import { user } from '../../localstores'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const username = computed(() => user.User.username())
const avatarUrl = computed(() => user.User.avatarUrl())

onMounted(() => {
  user.User.getUser()
})

const onLogoutClick = () => {
  Cookies.remove('X-Token')
  user.User.setAvatar(undefined as unknown as string)
  user.User.setUsername(undefined as unknown as string)
}

const router = useRouter()

const onLoginClick = () => {
  void router.push({ path: '/wechat/login' })
}

</script>
