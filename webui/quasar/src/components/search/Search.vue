<template>
  <q-page>
    <div style='width: 100%; height: 100vh;' class='flex justify-center items-center'>
      <div style='height: 100vh; width: 960px; max-width: 100%;' class='bg-grey-2'>
        <q-scroll-area
          style='height: calc(100% - 64px); width: 100%; padding: 0 24px;'
          ref='chatBox'
          :bar-style='{ width: "2px" }'
          :thumb-style='{ width: "2px" }'
          class='cursor-pointer'
        >
          <div v-for='(result, index) in searchResults' :key='index' :style='{padding: "16px 0"}'>
            <div style='display: flex; line-height: 36px; align-items: center;' class='q-py-md'>
              <q-avatar size='36px'>
                <q-img :src='modelLogo(result.modelId)' style='height: 36px; width: 36px; border-radius: 50%;' />
              </q-avatar>
              <div style='font-weight: 600; font-size: 18px; line-height: 1.2em;' class='text-grey-6 q-ml-sm'>
                {{ modelName(result.modelId) }}
              </div>
            </div>
            <div v-html='result.message' class='full-width' />
          </div>
        </q-scroll-area>
        <div class='flex justify-center items-center'>
          <BottomFixInput
            v-model='prompt'
            placeholder='随便问点儿啥~'
            @enter='onPromptEnter'
            :disabled='searching'
            :loading='searching'
            width='720px'
            max-width='calc(100% - 8px)'
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { model, search, simulator } from 'src/localstores'
import { purify } from 'src/utils'
import { computed, onMounted, ref, watch, nextTick } from 'vue'

import BottomFixInput from '../input/BottomFixInput.vue'

const models = computed(() => model.Model.models())
const searchResults = ref([] as search.SearchResult[])
const searchResultCount = computed(() => searchResults.value.length)
const searchResultAudios = ref([] as string[])
const topic = computed(() => search.Search.topic())
const prompt = ref(topic.value)

const scrollTop = ref(999999)
const searching = ref(false)

const audioInput = ref(false)

watch(searchResultCount, async () => {
  await nextTick()
  scrollTop.value += 1
})

const modelLogo = (modelId: number) => {
  const model = models.value.find((el) => el.id === modelId)
  return model ? model.model_logo_url : ''
}

const modelName = (modelId: number) => {
  const model = models.value.find((el) => el.id === modelId)
  return model ? model.name : ''
}

const searchDo = async (_prompt: string) => {
  searching.value = true

  for (let i = 0; i < models.value.length; i++) {
    const simulator = await dbBridge._Simulator.randomPeek()
    const _model = models.value[i]

    entityBridge.Search.search(_prompt, searchResults.value.map((el) => el.message), _model.id, simulator.id, prompt.value, false).then((payload) => {
      searchResults.value.push({
        topic: payload.topic,
        prompt: payload.prompt,
        modelId: payload.modelId,
        message: purify.purifyHtmlThink(payload.text)
      })
      searchResultAudios.value.push(payload.audio)
      searching.value = false
    }).catch((e) => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Failed search: ${e}`)
    })
  }
}

watch(prompt, async () => {
  if (!audioInput.value || !prompt.value || !prompt.value.length) return

  await searchDo(prompt.value)
})

const onPromptEnter = async (_prompt: string) => {
  await searchDo(_prompt)

  prompt.value = ''
}

onMounted(() => {
  model.Model.getModels(() => {
    simulator.Simulator.getSimulators(undefined, () => {
      if (prompt.value?.length) void searchDo(prompt.value)
    })
  })
})
</script>
