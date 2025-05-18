<template>
  <View>
    <scroll-view
      scrollY={true}
      :style='{ height: searchContentHeight + "px" }'
      :scroll-top='scrollTop'
      showScrollbar={false}
      enhanced={true}
      showsVerticalScrollIndicator={false}
      :scroll-with-animation='true'
    >
      <View v-for='(result, index) in searchResults' :key='index' :style='{borderBottom : index < searchResults.length - 1 ? "1px solid gray" : "", padding: "16px 0"}'>
        <View style='display: flex;'>
          <Image :src='modelLogo(result.modelId)' style='height: 24px; width: 24px; border-radius: 50%;' />
          <View style='font-weight: 600;'>{{ modelName(result.modelId) }}</View>
        </View>
        <rich-text user-select :nodes='result.message' style='margin-left: 8px; font-size: 12px;' />
      </View>
    </scroll-view>
    <View style='display: flex;'>
      <ComplexInput v-model:prompt='prompt' v-model:height='searchInputHeight' v-model:audio-input='audioInput' placeholder='随便问点儿啥'>
        <template #actions>
          <View style='height: 24px; width: 24px; padding: 3px 0; margin-left: 4px; margin-right: -4px;' @click='onSearchClick'>
            <Image :src='searchIcon' style='width: 18px; height: 18px;' />
          </View>
        </template>
      </ComplexInput>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { dbBridge, entityBridge } from 'src/bridge'
import { model, search, simulator } from 'src/localstores'
import { purify } from 'src/utils'
import { computed, onMounted, ref, watch, nextTick } from 'vue'

import ComplexInput from '../input/ComplexInput.vue'

import { search as searchIcon } from 'src/assets'

const models = computed(() => model.Model.models())
const searchResults = ref([] as search.SearchResult[])
const searchResultCount = computed(() => searchResults.value.length)
const searchResultAudios = ref([] as string[])
const topic = computed(() => search.Search.topic())
const prompt = ref(topic.value)

const searchContentHeight = ref(0)
const searchInputHeight = ref(0)
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

watch(searchInputHeight, () => {
  if (Taro.getWindowInfo()) {
    searchContentHeight.value = Taro.getWindowInfo().windowHeight - 32 - searchInputHeight.value
  }
})

watch(searching, () => {
  if (searching.value) {
    Taro.showLoading({
      title: `${models.value.length}个AGI正在搜索...`
    })
  } else {
    Taro.hideLoading()
  }
})

const searchDo = () => {
  searching.value = true

  nextTick().then(() => scrollTop.value += 1)

  models.value.forEach((model) => {
    const simulator = dbBridge._Simulator.randomPeek()
    entityBridge.Search.search(prompt.value, searchResults.value.map((el) => el.message), model.id, simulator.id, prompt.value, false).then((payload) => {
      searchResults.value.push({
        topic: payload.topic,
        prompt: payload.prompt,
        modelId: payload.modelId,
        message: purify.purifyThink(payload.text)
      })
      searchResultAudios.value.push(payload.audio)
      searching.value = false
    }).catch((e) => {
      console.log(`Failed search: ${e}`)
    })
  })
}

const onSearchClick = () => {
  searchDo()
}

watch(prompt, () => {
  if (!audioInput.value || !prompt.value || !prompt.value.length) return

  searchDo()
})

onMounted(() => {
  Taro.setNavigationBarTitle({
    title: 'AGI问一问'
  })

  model.Model.getModels(() => {
    simulator.Simulator.getSimulators(undefined, () => {
      searchDo()
    })
  })

  if (Taro.getWindowInfo()) {
    searchContentHeight.value = Taro.getWindowInfo().windowHeight - 32
  }
})
</script>
