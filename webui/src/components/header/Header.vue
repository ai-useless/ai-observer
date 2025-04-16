<template>
  <div class='row items-center'>
    <div class='cursor-pointer' @click='onLogoClick'>
      <q-img
        :src='selectedIcon'
        height='36px'
        width='240px'
        fit='contain'
        position='0 0'
      />
    </div>
    <q-space />
    <q-tabs
      v-model='tab'
      class='text-black horizontal-inner-x-margin-right'
      narrow-indicator
      dense indicator-color='red-6'
    >
      <q-tab name='chat' label='chat' />
    </q-tabs>
  </div>
</template>

<script setup lang='ts'>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { lineraMemeLogo } from 'src/assets'

const route = useRoute()
const router = useRouter()
const path = computed(() => route.path)


const path2tab = () => {
  if (path.value.includes('chat')) return 'chat'
}

const tab = computed({
  get: () => path2tab(),
  set: (v: string) => {
    void router.push({ path: '/' + v })
  }
})
const selectedIcon = ref(lineraMemeLogo)

const goHome = () => {
  if (window.location.hostname.endsWith('linerameme.fun')) {
    selectedIcon.value = lineraMemeLogo
    void router.push({ path: window.location.pathname === '/' ? '/chat' : window.location.pathname })
  }
}

const onLogoClick = () => {
  goHome()
}

onMounted(() => {
  goHome()
})

</script>

<style scoped lang='sass'>
</style>
