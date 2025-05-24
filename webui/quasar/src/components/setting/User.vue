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
    <q-item dense clickable class='row cursor-pointer flex items-center'>
      <div class='text-grey-8'>
        用户名
      </div>
      <q-space />
      <div style='height: 18px; border-radius: 4px;'>
        {{ username }}
      </div>
    </q-item>
    <q-item dense clickable class='row cursor-pointer flex items-center'>
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
    <q-btn
      flat
      dense
      rounded
      icon='logout'
      class='full-width border-gradient-bg-white q-mt-md text-grey-8'
      @click='onLogoutClick'
    >
      退出登录
    </q-btn>
  </div>
</template>

<script setup lang='ts'>
import { Cookies } from 'quasar'
import { user } from 'src/localstores'
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
