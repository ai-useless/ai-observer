<template>
  <q-card style='width: 300px;'>
    <q-card-section class='row items-center'>
      <q-avatar size='56px' class='q-mr-md'>
        <q-img :src='_simulator?.simulator_avatar_url' :alt='role === dbModel.Role.HOST ? "主持人" : "嘉宾"' />
      </q-avatar>
      <div>
        <div class='text-h6'>
          {{ _simulator?.simulator }}
        </div>
        <div class='text-subtitle2 text-grey'>
          {{ role === dbModel.Role.HOST ? "主持人" : "嘉宾" }}
        </div>
      </div>
    </q-card-section>

    <q-card-section>
      {{ _simulator?.origin_personality }}
    </q-card-section>

    <q-card-actions align='right'>
      {{ _model }}
      <q-btn flat label='选择模型' color='gray-9' />
    </q-card-actions>
  </q-card>
</template>

<script setup lang='ts'>
import { model, simulator } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, toRef } from 'vue'

interface Props {
  participator: dbModel.Participator
}

// eslint-disable-next-line no-undef
const props = defineProps<Props>()
const participator = toRef(props, 'participator')

const role = computed(() => participator.value?.role)
const _simulator = computed(() => simulator.Simulator.simulator(participator.value?.simulatorId))
const _model = computed(() => model.Model.model(participator.value?.modelId))

</script>
