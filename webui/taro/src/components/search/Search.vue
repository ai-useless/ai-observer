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
      <View v-if='!searchResults.length || searching' style='text-align: center; font-size: 12px; margin: 8px 0 16px 0;'>
        {{ models.length }}个AGI正在搜索 ...
      </View>
    </scroll-view>
    <View style='display: flex;'>
      <Textarea
        type='textarea'
        :value='prompt'
        placeholder='继续搜索'
        style='width: calc(100% - 16px); font-size: 14px; min-height: 18px; border: 1px solid gray; border-radius: 8px; padding: 8px;'
        class='section-margin'
        @input='handleInput'
        autoHeight={true}
      />
      <View style='height: 32px; width: 32px; padding: 7px 0 7px 4px;' @click='onSearchClick'>
        <Image :src='searchIcon' style='width: 18px; height: 18px;' />
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { View, Image, Textarea, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { dbBridge, entityBridge } from 'src/bridge'
import { model, search, simulator } from 'src/localstores'
import { purify } from 'src/utils'
import { computed, onMounted, ref, watch, nextTick } from 'vue'

import { search as searchIcon } from 'src/assets'

const models = computed(() => model.Model.models())
const searchResults = ref([] as search.SearchResult[])
const searchResultCount = computed(() => searchResults.value.length)
const searchResultAudios = ref([] as string[])
const topic = computed(() => search.Search.topic())
const prompt = ref(topic.value)

const searchContentHeight = ref(0)
const scrollTop = ref(999999)
const searching = ref(true)

watch(searchResultCount, async () => {
  await nextTick()
  scrollTop.value += 1
})

const modelLogo = (modelId: number) => {
  return models.value.find((el) => el.id === modelId)?.model_logo_url
}

const modelName = (modelId: number) => {
  return models.value.find((el) => el.id === modelId)?.name
}

const handleInput = (e: { detail: { value: string } }) => {
  prompt.value = e.detail.value
}

const searchDo = (initial: boolean) => {
  searching.value = true

  nextTick().then(() => scrollTop.value += 1)

  models.value.forEach((model) => {
    const simulator = dbBridge._Simulator.randomPeek()
    entityBridge.Search.search(topic.value, initial ? [] : searchResults.value.map((el) => el.message), model.id, simulator.id, prompt.value, false).then((payload) => {
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
  searchDo(prompt.value === topic.value)
}

onMounted(() => {
  model.Model.getModels(() => {
    simulator.Simulator.getSimulators(undefined, () => {
      searchDo(true)
    })
  })

  if (Taro.getWindowInfo()) {
    searchContentHeight.value = Taro.getWindowInfo().windowHeight - 22
  }
})
</script>
