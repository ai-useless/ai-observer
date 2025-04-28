<template>
  <View style='padding: 8px;'>
    <Text style='width: 100%; display: flex; justify-content: center; align-items: center;' class='title'>
      您想让AGI讨论点儿什么呢 ?
    </Text>
    <Input
      type='textarea'
      :value='topic'
      placeholder='您想让AGI讨论点儿什么呢 ?'
      style='width: "100%"; font-size: 20px; min-height: 200px;'
      class='section-margin'
    />
    <Button
      class='border'
      @click='onStartDiscussClick'
      size='mini'
      style='width: 100%;'
    >
      开始讨论
    </Button>
    <View style='margin-top: 24px;'>
      <Button
        class='border'
        size='mini'
      >
        随便听点儿什么
      </Button>
      <Button
        class='border'
        size='mini'
      >
        历史
      </Button>
      <Button
        class='border'
        size='mini'
      >
        二战
      </Button>
      <!-- You must bind event to button if you place more than 4 buttons here -->
    </View>
  </View>
</template>

<script setup lang='ts'>
import { dbBridge } from 'src/bridge'
import { seminar, setting } from 'src/localstores'
import { ref, watch, computed } from 'vue'
import { View, Input, Button, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'

const initialTopics = [
  '油条的工艺与口味以及外观',
  '房产新政与房价调控',
  '富士康“九连跳”事件',
  '唐骏“学历门”诚信危机',
  '个税调整与两会热点',
  '移民潮及技术精英移民现象',
  '曹操墓真伪考古争议',
  '东莞扫黄行动',
  '吴英案死刑争议',
  '中美关系走向及台海军售争议',
  '朝韩军事冲突可能性与中美博弈',
  '钓鱼岛争端及中日关系',
  '美乌再谈判局势',
  '美国政府“关门”及其影响',
  '奥巴马亚洲行意图分析',
  '日本武器出口政策',
  '印度新政对中印关系影响',
  '人民币汇率改革与国际压力',
  '央行降息与经济新常态',
  '股市走势与金融危机影响',
  '延迟退休政策',
  '制造业发展与转型',
  '电影票房现象（如《哪吒》）与文化重构',
  'AI技术发展与全球权力格局',
  '社交网络的社会影响',
  '洋奶粉安全信任问题'
]

const _seminar = computed(() => dbBridge._Seminar.seminar(seminar.Seminar.seminar()))
const topic = ref(_seminar.value?.topic || initialTopics[Math.floor(Math.random() * initialTopics.length)])
const tabIndex = computed(() => setting.Setting.tabIndex())

watch(topic, () => {
  topic.value = topic.value.replace('\n', '')
})

const createSeminar = () => {
  const _uid = dbBridge._Seminar.create(topic.value)
  seminar.Seminar.setSeminar(_uid)
}

const onStartDiscussClick = () => {
  createSeminar()
}

useDidShow(async () => {
  // If we're first time in here, goto seminar with random topic
  if (tabIndex.value < 0) {
    if (!_seminar.value) createSeminar()
    setting.Setting.setTabIndex(1)
    Taro.switchTab({ url: '/pages/seminar/SeminarPage' })
  }
})

</script>

<style scoped lang='sass'>
.border
  border: 1px solid var(--red-3)
</style>
