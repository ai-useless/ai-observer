<template>
  <View style='padding: 8px;'>
    <Text style='width: 100%;' class='title'>
      您想让AGI讨论点儿什么呢 ?
    </Text>
    <Input
      type='textarea'
      :value='topic'
      placeholder='您想让AGI讨论点儿什么呢 ?'
      style='width: "100%"; font-size: 20px; min-height: 120px; border: 1px solid gray; border-radius: 16px; padding: 8px;'
      class='section-margin'
      @input='handleInput'
    />
    <Button
      class='border'
      @click='onStartDiscussClick'
      size='mini'
      style='width: 100%; margin-top: 16px; border-radius: 8px; color: blue;'
    >
      开始讨论
    </Button>
    <View style='margin-top: 16px;' class='container'>
      <Button
        class='border'
        size='mini'
        v-for='clazz in presetClasses'
        :key='clazz'
        @click='onGenerateTopics(clazz)'
        :disabled='generating'
        :style='{ color: generating ? "gray" : "black" }'
      >
        {{ clazz }}
      </Button>
    </View>
    <View style='margin-top: 16px;' v-if='topicType.length'>
      <View style='width: 100%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid gray; padding-bottom: 4px;'>
        <View class='title'>{{ topicType }}</View>
        <View class='title' style='color: blue' @click='onChangeTopicsClick'>{{ generating ? '生成中...' : '换一批' }}</View>
      </View>
      <View v-if='topics.length' style='margin-top: 8px;'>
        <View v-for='_topic in topics' style='font-size: 14px; color: blue;'>
          {{ _topic }}
        </View>
      </View>
      <View v-else class='title' style='height: 200px; display: flex; justify-content: center; align-items: center;'>
        AGI正在为您生成话题...
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
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

const presetClasses = [
  '随便讨论点儿什么',
  '历史',
  '二战',
  '量子物理',
  '春秋战国',
  '关于夏朝',
  '大航海时代',
  '文艺复兴',
  '羊吃人运动',
  '微博热点',
  '央视热点',
  '今日热搜'
]

const _seminar = computed(() => dbBridge._Seminar.seminar(seminar.Seminar.seminar()))
const topic = ref(_seminar.value?.topic || initialTopics[Math.floor(Math.random() * initialTopics.length)])
const tabIndex = computed(() => setting.Setting.tabIndex())
const topicType = ref('')
const historyTopics = ref([] as string[])
const topics = ref([] as string[])

const handleInput = (e: { detail: { value: string } }) => {
  topic.value = e.detail.value
}

watch(topic, () => {
  topic.value = topic.value.replace('\n', '')
})

const startSeminar = () => {
  const _uid = dbBridge._Seminar.create(topic.value)
  seminar.Seminar.setSeminar(_uid)
  setting.Setting.setTabIndex(1)
  Taro.switchTab({ url: '/pages/seminar/SeminarPage' })
}

const onStartDiscussClick = () => {
  startSeminar()
}

useDidShow(async () => {
  // If we're first time in here, goto seminar with random topic
  if (tabIndex.value < 0) {
    if (!_seminar.value) startSeminar()
  }
})

const generating = ref(false)

const generateTopics = async () => {
  let clazz = topicType.value
  if (topicType.value === presetClasses.values[0]) clazz = '随机不同领域可以输出观点的话题'
  generating.value = true
  topics.value = await entityBridge.Topic.generateTopics(clazz, 10, historyTopics.value)
  historyTopics.value.push(...topics.value)
  generating.value = false
}

const onGenerateTopics = async (clazz: string) => {
  if (generating.value) return

  historyTopics.value = []
  topicType.value = clazz

  await generateTopics()
}

const onChangeTopicsClick = async () => {
  if (generating.value) return
  await generateTopics()
}

</script>

<style scoped lang='sass'>
.border
  border: 1px solid var(--red-3)

.container
  display: flex
  justify-content: flex-start

.container > *:not(:last-child)
  margin-right: 8px
</style>
