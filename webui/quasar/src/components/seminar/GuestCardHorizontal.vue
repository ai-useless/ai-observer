<template>
  <q-card class='border-gradient-bg-white hover-slide-up-10px border-radius-16px full-width row cursor-pointer'>
    <q-card-section class='row justify-center items-center bg-gradient-blue text-white' style='height: 220px; width: 220px; border-radius: 14px 0 0 14px;'>
      <div class='full-width text-center'>
        <q-avatar v-if='_simulator' size='128px'>
          <q-img :src='_simulator?.simulator_avatar_url' />
        </q-avatar>
        <div v-if='_simulator' class='text-h6 q-mt-sm'>
          {{ _simulator?.simulator }}
        </div>
        <div v-else class='text-subtitle2'>
          {{ role === dbModel.Role.HOST ? "主持人" : "嘉宾" }}
        </div>
      </div>
    </q-card-section>

    <q-card-section class='text-grey-9'>
      <div v-if='_simulator' class='full-height'>
        <div class='full-width'>
          <span class='text-bold text-gradient-red' style='font-size: 20px;'>{{ _simulator?.simulator }}</span>
          <span class='q-ml-sm' style='font-size: 12px;'>{{ _simulator?.title }}</span>
        </div>
        <div style='margin-top: 40px;'>
          <div>{{ _simulator?.origin_personality }}</div>
          <div v-if='_model' class='q-mt-xs row'>
            <div class='border-gradient-bg-white border-radius-round' style='width: 26px;'>
              <q-avatar v-if='_simulator' size='24px'>
                <q-img :src='_model.model_logo_url' />
              </q-avatar>
            </div>
            <div class='border-gradient-bg-white border-radius-round q-ml-xs' style='width: 26px;'>
              <q-avatar v-if='_simulator' size='24px'>
                <q-img :src='_model.author_logo_url' />
              </q-avatar>
            </div>
            <div class='border-gradient-bg-white border-radius-round q-ml-xs' style='width: 26px;'>
              <q-avatar v-if='_simulator' size='24px'>
                <q-img :src='_model.vendor_logo_url' />
              </q-avatar>
            </div>
          </div>
          <div v-if='_model' class='flex items-center text-grey-6 q-mt-xs'>
            使用
            <q-badge class='bg-gradient-blue q-mx-xs'>
              {{ _model.vendor }}
            </q-badge>
            提供的
            <q-badge class='bg-gradient-blue q-mx-xs'>
              {{ _model.name }}
            </q-badge>模型
          </div>
        </div>
      </div>
      <div v-else class='full-height flex justify-center items-center'>
        <span>点击我或拖动AGI模拟器和模型到这里设置为主持人~</span>
        <q-icon name='help' size='20px' class='text-gray-6 cursor-pointer q-ml-xs'>
          <q-tooltip style='font-size: 14px;'>
            您知道吗：模拟器设置主持人的人格和声音，模型设置主持人的生成内容的LLM模型。
          </q-tooltip>
        </q-icon>
      </div>
    </q-card-section>

    <q-space />

    <q-card-actions align='right' class='flex justify-end items-end'>
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
