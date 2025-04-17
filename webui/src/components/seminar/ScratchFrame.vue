<template>
  <div class='text-center'>
    <h3 class='text-grey-9'>
      What would you like to dig ?
    </h3>
    <q-input
      rounded
      outlined
      v-model='topic'
      placeholder='Key in any topic you are interesting in'
      type='textarea'
      style='width: 800px; font-size: 20px;'
      @keyup.enter.stop='onEnter'
    />
    <div style='margin-top: 24px;'>
      <q-btn
        rounded
        flat
        label='Random topic'
        no-caps
        class='text-grey-7 border'
      />
      <q-btn
        rounded
        flat
        label='History topic'
        no-caps
        class='text-grey-7 border'
        style='margin-left: 8px;'
      />
      <q-btn
        rounded
        flat
        label='The World War II'
        no-caps
        class='text-grey-7 border'
        style='margin-left: 8px;'
      />
      <q-btn
        rounded
        flat
        label='Big Countries Battle'
        no-caps
        class='text-grey-7 border'
        style='margin-left: 8px;'
      />
    </div>
  </div>
</template>

<script setup lang='ts'>
import { dbBridge } from 'src/bridge'
import { seminar, setting } from 'src/localstore'
import { ref, watch } from 'vue'

import { useI18n } from 'vue-i18n'

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t } = useI18n({ useScope: 'global' })

// TODO: random initial topic
const topic = ref(t('MSG_INITIAL_TIP'))

watch(topic, () => {
  topic.value = topic.value.replace('\n', '')
})

const onEnter = async () => {
  const _uid = await dbBridge._Seminar.create(topic.value)
  seminar.Seminar.setSeminar(_uid)
  setting.Setting.setInScratch(false)
}

</script>

<style scoped lang='sass'>
.border
  border: 1px solid $red-3
</style>
