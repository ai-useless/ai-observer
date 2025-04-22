<template>
  <q-layout view='hHh Lpr lFf'>
    <q-header>
      <q-toolbar class='text-white bg-white vertical-menu-padding'>
        <Header class='full-width' />
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
    <q-footer>
      <q-toolbar class='text-white bg-white vertical-menu-padding'>
        <Footer class='full-width' />
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang='ts'>
import { onMounted } from 'vue'
import { notify } from 'src/localstores'

import Header from 'src/components/header/Header.vue'
import Footer from 'src/components/footer/Footer.vue'

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

</script>
