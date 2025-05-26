<template>
  <q-layout view='hHh Lpr lFf'>
    <q-drawer
      :mini='collapsed'
      show-if-above
      bordered
      :breakpoint='500'
      :width='240'
      transition-show='slide-in-left'
      transition-hide='slide-out-left'
      class='bg-grey-2'
      swipe-area='50'
      overlay
      style='z-index: 9999 !important;'
    >
      <SidebarMenu v-model:collapsed='collapsed' />
    </q-drawer>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import { notify } from 'src/localstores'

import SidebarMenu from 'src/components/sidebar/SidebarMenu.vue'

const _notify = notify.useNotificationStore()

onMounted(() => {
  _notify.$subscribe((_, state) => {
    state.Notifications.forEach((notif, index) => {
      if (notif.Popup) {
        state.Notifications.splice(index, 1)
        notify.notify(notif)
      }
    })
  })
})

const collapsed = ref(false)

</script>
