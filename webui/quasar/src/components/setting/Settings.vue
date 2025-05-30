<template>
  <div>
    <q-item dense clickable class='row cursor-pointer flex items-center border-radius-8px' @click='onAudioClick'>
      <div class='text-grey-8'>
        生成音频
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
    <q-item dense class='row flex items-center border-radius-8px'>
      <div class='text-grey-8'>
        默认念经风格
      </div>
      <q-space />
      <div style=' height: 18px;'>
        <div class='row'>
          <q-badge @click='onStyleClick("念诵")' :outline='style !== "念诵"' color='blue-6' class='cursor-pointer'>念诵</q-badge>
          <q-badge @click='onStyleClick("吟唱")' :outline='style !== "吟唱"' color='blue-6' class='q-ml-xs cursor-pointer'>吟唱</q-badge>
        </div>
      </div>
    </q-item>
  </div>
</template>

<script setup lang='ts'>
import { dbBridge } from '../../bridge'
import { dbModel } from '../../model'
import { onMounted, ref } from 'vue'

const generateAudio = ref(true)
const style = ref('吟唱')

const onAudioClick = async () => {
  generateAudio.value = !generateAudio.value
  await dbBridge._Setting.create(dbModel.SettingKey.GENERATE_AUDIO, generateAudio.value)
}

onMounted(async () => {
  style.value = await dbBridge._Setting.get(dbModel.SettingKey.NIANJING_STYPE) as string
  if (!style.value) {
    await dbBridge._Setting.create(dbModel.SettingKey.NIANJING_STYPE, '吟唱')
    style.value = '吟唱'
  }
  generateAudio.value = await dbBridge._Setting.get(dbModel.SettingKey.GENERATE_AUDIO) as boolean
})

const onStyleClick = async (_style: string) => {
  await dbBridge._Setting.create(dbModel.SettingKey.NIANJING_STYPE, _style)
  style.value = _style
}

</script>
