<template>
  <div class='full-width'>
    <q-card class='q-pb-sm border-radius-16px' style='max-width: 90%; width: 400px'>
      <q-card-section class='text-grey-9'>
        <div class='text-h6 text-center'>
          选择模型
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-input
          rounded
          dense
          v-model='modelSearch'
          placeholder='搜索模型...'
          outlined
        >
          <template #prepend>
            <q-icon name='search' size='24px' />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section dense style='height: 400px;' class='q-pa-none q-pb-md'>
        <q-scroll-area class='fit'>
          <q-list>
            <q-item
              v-for='(_model, index) in filteredModels'
              :key='index'
              clickable
              @click='selectModel(_model)'
              :active='selectedModel === _model'
              active-class='text-blue-2'
              class='q-px-lg'
            >
              <q-item-section>
                <ModelCard :model='_model' />
              </q-item-section>
              <q-item-section side>
                <q-icon
                  name='check'
                  :color='selectedModel?.name === _model.name ? "primary" : "transparent"'
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-card-section>

      <q-separator />

      <q-card-actions align='right'>
        <q-btn
          label='取消'
          class='full-width border-gradient-bg-white text-grey-9'
          flat
          rounded
          @click='onCancelClick'
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script setup lang='ts'>
import { dbBridge } from 'src/bridge'
import { model } from 'src/localstores'
import { computed, onMounted, ref, defineModel, defineEmits } from 'vue'

import ModelCard from '../model/ModelCard.vue'

const models = ref([] as model._Model[])
const selectedModel = defineModel<model._Model>('selected')
const modelSearch = ref('')

const filteredModels = computed(() => {
  if (!modelSearch.value?.length) {
    return models.value
  }
  return models.value.filter(model =>
    model.name.toLowerCase().includes(modelSearch.value.toLowerCase()) ||
    model.vendor.toLowerCase().includes(modelSearch.value.toLowerCase()) ||
    model.author.toLowerCase().includes(modelSearch.value.toLowerCase())
  )
})

const emit = defineEmits<{(ev: 'selected', model: model._Model): void,
  (ev: 'cancel'): void
}>()

const selectModel = (model: model._Model) => {
  selectedModel.value = model
  emit('selected', model)
}

const onCancelClick = () => {
  emit('cancel')
}

onMounted(async () => {
  models.value = await dbBridge._Model.models()
})

</script>
