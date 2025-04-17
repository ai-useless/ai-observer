<template>
  <div class='row items-center'>
    <div class='cursor-pointer' @click='onLogoClick' style='width: 120px;'>
      <q-img
        :src='aiObserverLogo'
        height='36px'
        width='240px'
        fit='contain'
        position='0 0'
      />
    </div>
    <q-space />
    <div v-if='_seminar' class='text-grey-8'>
      <div>{{ _seminar.topic }}</div>
    </div>
    <q-space />
    <div style='width: 120px;' class='text-right'>
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
  </div>
</template>

<script setup lang='ts'>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { seminar } from 'src/localstore'
import { dbModel } from 'src/model'
import { dbBridge } from 'src/bridge'

import { aiObserverLogo } from 'src/assets'

const router = useRouter()
const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)

watch(_uid, async () => {
  if (!_uid.value) return
  _seminar.value = await dbBridge._Seminar.get(_uid.value) as dbModel.Seminar
})

const onLogoClick = () => {
  void router.push({ path: '/seminar' })
}

onMounted(async () => {
  await dbBridge._Model.initialize()
  await dbBridge._Simulator.initialize()

  if (_uid.value) {
    _seminar.value = await dbBridge._Seminar.get(_uid.value) as dbModel.Seminar
  }
  void router.push({ path: '/seminar' })
})

</script>

<style scoped lang='sass'>
.menu-item
  width: 148px
</style>
