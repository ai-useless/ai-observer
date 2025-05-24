<template>
  <q-page>
    <q-dialog v-model='logining' persistent>
      <WechatLogin :from-login-page='true' @cancel='onCancel' />
    </q-dialog>
  </q-page>
</template>

<script setup lang='ts'>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import WechatLogin from 'src/components/login/WechatLogin.vue'

const logining = ref(true)
const router = useRouter()

const onCancel = () => {
  logining.value = false
  void router.push({ path: '/' })
}

</script>
