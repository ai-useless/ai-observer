<template>
  <div>
    <q-item dense clickable class='row cursor-pointer flex items-center' @click='onAudioClick'>
      <div class='text-grey-8'>
        启用音频
      </div>
      <q-space />
      <div style='border: 1px solid grey; width: 18px; height: 18px; border-radius: 4px;'>
        <q-icon
          v-if='generateAudio'
          name='check'
          color='green-6'
          size='16px'
          style='margin-top: -6px;'
        />
      </div>
    </q-item>
  </div>
</template>

<script setup lang='ts'>
import { dbBridge } from 'src/bridge'
import { dbModel } from 'src/model'
import { onMounted, ref } from 'vue'

const generateAudio = ref(true)

const onAudioClick = async () => {
  generateAudio.value = !generateAudio.value
  await dbBridge._Setting.create(dbModel.SettingKey.GENERATE_AUDIO, generateAudio.value)
}

onMounted(async () => {
  generateAudio.value = await dbBridge._Setting.get(dbModel.SettingKey.GENERATE_AUDIO) as boolean
})

</script>
