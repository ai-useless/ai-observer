<template>
  <div class='row items-center'>
    <div class='cursor-pointer' @click='onLogoClick'>
      <q-img
        :src='aiObserverLogo'
        height='36px'
        width='240px'
        fit='contain'
        position='0 0'
      />
    </div>
    <q-space />
    <q-btn flat dense rounded class='bg-grey-4'>
      <q-icon name='bi-three-dots-vertical' size='24px' color='grey-6' />
      <q-menu>
        <q-list dense>
          <q-item clickable class='menu-item row items-center'>
            <q-icon name='bi-gear' color='grey' size='16px' />
            <div style='margin-left: 16px;'>
              Round table
            </div>
          </q-item>
          <q-separator />
          <q-item clickable class='menu-item row items-center'>
            <q-icon name='bi-slash-circle' color='grey' size='16px' />
            <div style='margin-left: 16px;'>
              Stop session
            </div>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup lang='ts'>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { aiObserverLogo } from 'src/assets'

const router = useRouter()

const onLogoClick = () => {
  void router.push({ path: '/seminar' })
}

onMounted(() => {
  void router.push({ path: '/seminar' })
})

</script>

<style scoped lang='sass'>
.menu-item
  width: 148px
</style>
