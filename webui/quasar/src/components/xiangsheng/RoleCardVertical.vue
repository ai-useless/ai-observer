<template>
  <q-card clickable class='border-gradient-bg-white border-radius-16px cursor-pointer hover-slide-up-10px full-width'>
    <q-card-section class='row justify-center items-center bg-gradient-blue text-white' style='height: 180px; border-radius: 14px 14px 0 0;'>
      <q-avatar size='128px' class='q-mr-md'>
        <q-img :src='_simulator?.simulator_avatar_url' :alt='role === dbModel.Role.HOST ? "逗哏" : "捧哏"' />
      </q-avatar>
      <div class='full-width self-end' style='margin-top: -28px;'>
        <div v-if='_simulator'>
          <div v-if='_model' class='row'>
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
          <div class='text-h6'>
            <span class='text-bold text-white' style='font-size: 20px;'>{{ _simulator?.simulator }}</span>
            <span class='q-ml-sm' style='font-size: 12px;'>{{ _simulator?.title }}</span>
          </div>
        </div>
        <div v-else class='text-subtitle2'>
          {{ role === dbModel.Role.HOST ? "逗哏" : "捧哏" }}
        </div>
      </div>
    </q-card-section>

    <q-card-section class='text-grey-9'>
      <div v-if='_simulator' class='full-height'>
        <div>
          <div>{{ _simulator?.origin_personality }}</div>
          <div v-if='_model' class='flex items-center text-grey-6 q-mt-xs'>
            <q-badge class='bg-gradient-blue q-mr-xs q-mt-xs'>
              {{ _model.vendor }}
            </q-badge>
            <q-badge class='bg-gradient-blue q-mr-xs q-mt-xs'>
              {{ modelName }}
            </q-badge>
          </div>
        </div>
      </div>
      <div v-else class='full-height flex items-center'>
        <span>点我设置模拟器和模型为捧哏~
          <q-icon name='help' size='20px' class='text-gray-6 cursor-pointer q-ml-xs'>
            <q-tooltip style='font-size: 14px;'>
              您知道吗：模拟器设置逗哏的人格和声音，模型设置逗哏的生成内容的LLM模型。
            </q-tooltip>
          </q-icon>
        </span>
      </div>
    </q-card-section>

    <q-card-actions align='right'>
      <q-btn
        flat
        dense
        label='听听声音'
        class='border-gradient-bg-white border-radius-16px text-grey-9'
        style='font-size: 12px;'
        @click.stop='onPlayClick'
        :disabled='playing || !_simulator'
      />
      <q-btn
        flat
        dense
        label='选择模型'
        class='bg-gradient-blue border-radius-16px text-white'
        style='font-size: 12px;'
        @click.stop='onSelectModelClick'
      />
    </q-card-actions>
  </q-card>
  <q-dialog v-model='selectingModel'>
    <div>
      <ModelSelector v-model:selected='selectedModel' @cancel='onCancelSelectModel' @selected='onModelSelected' />
    </div>
  </q-dialog>
</template>

<script setup lang='ts'>
import { model, simulator } from 'src/localstores'
import { dbModel } from 'src/model'
import { computed, onBeforeUnmount, ref, toRef } from 'vue'
import { AudioPlayer } from 'src/player'

import ModelSelector from '../selector/ModelSelector.vue'

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

const modelNameLen = computed(() => _model.value?.name?.split('/').length)
const modelName = computed(() => modelNameLen.value ? _model.value?.name?.split('/')[modelNameLen.value - 1] : _model.value?.name)

const selectingModel = ref(false)
const selectedModel = ref(undefined as unknown as model._Model)

const playing = defineModel<boolean>('playing')
const audioPlayer = ref(undefined as unknown as AudioPlayer)

const onSelectModelClick = () => {
  selectingModel.value = true
}

const onPlayClick = async () => {
  if (!_simulator.value) return
  playing.value = true
  audioPlayer.value = await AudioPlayer.play(_simulator.value.audio_url, undefined, () => {
    playing.value = false
  }) as AudioPlayer
}

const onCancelSelectModel = () => {
  selectingModel.value = false
}

const onModelSelected = (_model: model._Model) => {
  selectingModel.value = false
  participator.value.modelId = _model.id
}

onBeforeUnmount(() => {
  if (audioPlayer.value) {
    audioPlayer.value.stop()
    audioPlayer.value = undefined as unknown as AudioPlayer
  }
  playing.value = false
})

</script>
