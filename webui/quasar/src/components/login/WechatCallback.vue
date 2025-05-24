<template>
  <q-page>
    <q-dialog v-model='processing' persistent>
      <q-card style='width: min(100%, 320px); height: 400px' class='column'>
        <q-card-section>微信扫码登录</q-card-section>
        <q-separator />
        <q-card-section class='q-mt-auto q-pa-none' style='flex-grow: 1; overflow: auto;'>
          <div v-if='code?.length' style='height: 100%; width: 100%;'>
            <div v-if='cooking' class='flex justify-center items-center bg-grey-2' style='height: 100%; width: 100%;'>
              <div
                style='font-size: 20px;'
                class='text-center text-grey-8 flex justify-center items-center'
              >
                <div>
                  <q-spinner-facebook class='text-red-4' size='64px' />
                  <div style='font-size: 14px'>
                    正在完善用户信息，请稍候...
                  </div>
                </div>
              </div>
            </div>
            <div v-else class='text-grey-8 flex justify-center items-center full-height full-width'>
              {{ info }}
            </div>
          </div>
          <div v-if='error?.length' class='text-grey-8 flex justify-center items-center full-height full-width'>
            {{ error }}
          </div>
        </q-card-section>
        <q-card-actions v-if='error?.length' class='q-mb-sm'>
          <div class='full-width'>
            <q-btn
              flat
              rounded
              @click='onGogoLoginClick'
              style='width: 100%'
              class='bg-gradient-blue text-white'
              :tabindex='0'
            >
              重新登录试试
            </q-btn>
            <q-btn
              flat
              rounded
              @click='onCancelLoginClick'
              style='width: 100%'
              class='border-gradient-bg-white q-mt-sm'
            >
              随便逛逛，以后再登录~
            </q-btn>
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang='ts'>
import { user } from 'src/localstores'
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface Query {
  code: string
  error: string
  state: string
}
const route = useRoute()
const code = ref((route.query as unknown as Query).code)
const error = ref((route.query as unknown as Query).error)
const state = ref((route.query as unknown as Query).state)

const processing = ref(true)
const cooking = ref(true)
const info = ref('登录成功啦！现在开始多姿多彩的AGI之旅吧！')
const success = ref(false)

const timer = ref(-1)
const router = useRouter()

watch(success, () => {
  timer.value = window.setTimeout(() => {
    processing.value = false
    if (state.value.endsWith('_fromLogin')) {
      void router.push({ path: '/' })
    }
  }, 2000)
})

onMounted(() => {
  if (code.value?.length) {
    user.User.cookUser(code.value, (_error: boolean) => {
      cooking.value = false
      if (_error) {
        error.value = '获取用户信息出错啦！请再试试吧！'
        code.value = undefined as unknown as string
        return
      }
      success.value = true
    })
  }
})

const onGogoLoginClick = () => {
  processing.value = false
  void router.push({ path: '/wechat/login' })
}

const onCancelLoginClick = () => {
  processing.value = false
  if (state.value.endsWith('_fromLogin')) {
    void router.push({ path: '/' })
  }
}

</script>
