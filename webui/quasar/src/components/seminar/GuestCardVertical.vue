<template>
  <q-card class='border-gradient-bg-white border-radius-16px cursor-pointer hover-slide-up-10px full-width'>
    <q-card-section class='row justify-center items-center bg-gradient-blue text-white' style='height: 260px; border-radius: 14px 14px 0 0;'>
      <q-avatar size='56px' class='q-mr-md'>
        <q-img :src='_simulator?.simulator_avatar_url' :alt='role === dbModel.Role.HOST ? "主持人" : "嘉宾"' />
      </q-avatar>
      <div class='full-width self-end'>
        <div v-if='_simulator' class='text-h6'>
          {{ _simulator?.simulator }}
        </div>
        <div v-else class='text-subtitle2'>
          {{ role === dbModel.Role.HOST ? "主持人" : "嘉宾" }}
        </div>
      </div>
    </q-card-section>

    <q-card-section class='flex justify-center items-center text-grey-9'>
      <div>
        <span v-if='_simulator'>
          {{ _simulator?.origin_personality }}
        </span>
        <span v-else>
          点击我或拖动AGI模拟器和模型到这里设置为嘉宾~
        </span>
        <q-icon name='help' size='20px' class='text-gray-6 cursor-pointer q-ml-xs'>
          <q-tooltip style='font-size: 14px;'>
            您知道吗：模拟器设置主持人的人格和声音，模型设置主持人的生成内容的LLM模型。
          </q-tooltip>
        </q-icon>
      </div>
    </q-card-section>

    <q-card-actions align='right'>
      {{ _model }}
      <q-btn
        flat
        dense
        label='选择模型'
        class='bg-gradient-blue border-radius-16px text-white'
        style='font-size: 12px;'
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang='ts'>
import { model, simulator } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, toRef } from 'vue'

interface Props {
  participator: dbModel.Participator
  role: dbModel.Role
}

// eslint-disable-next-line no-undef
const props = defineProps<Props>()
const participator = toRef(props, 'participator')
const role = toRef(props, 'role')

const _simulator = computed(() => simulator.Simulator.simulator(participator.value?.simulatorId))
const _model = computed(() => model.Model.model(participator.value?.modelId))

</script>
