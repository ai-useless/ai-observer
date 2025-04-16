<template>
  <div class='row'>
    <q-space />
    <div style='width: 100%; max-width: 960px;'>
      <h3 class='text-grey-9 text-left'>
        {{ topic }}
      </h3>
    </div>
    <q-space />
  </div>
</template>

<script setup lang='ts'>
import { dbBridge } from 'src/bridge'
import { seminar } from 'src/localstore'
import { dbModel } from 'src/model'
import { computed, onMounted, ref, watch } from 'vue'

const _uid = computed(() => seminar.Seminar.seminar())
const _seminar = ref(undefined as unknown as dbModel.Seminar)

const topic = computed(() => _seminar.value?.topic)

watch(_uid, async () => {
  _seminar.value = await dbBridge._Seminar.get(_uid.value) as dbModel.Seminar
})

onMounted(async () => {
  _seminar.value = await dbBridge._Seminar.get(_uid.value) as dbModel.Seminar
})

</script>

<style scoped lang='sass'>
</style>
