<template>
  <div>
    <q-input
      dense
      outlined
      rounded
      placeholder='Key in any topic you are interesting in'
      v-model='topic'
      style='min-width: 600px; max-width: 100%;'
      clearable
    />
  </div>
</template>

<script setup lang='ts'>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t } = useI18n({ useScope: 'global' })

// TODO: random initial topic
const topic = ref(t('MSG_INITIAL_TIP'))

// TODO: detect if it's a valid topic

</script>
