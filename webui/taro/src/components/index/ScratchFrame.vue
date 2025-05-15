<template>
  <View>
    <Text style='width: 100%;' class='title'>
      您想让AGI做点儿什么呢 ?
    </Text>
    <Textarea
      type='textarea'
      :value='topic'
      placeholder='您想让AGI讨论点儿什么呢 ?'
      style='width: calc(100% - 50px); font-size: 20px; min-height: 120px; border: 1px solid gray; border-radius: 16px; padding: 8px;'
      class='section-margin'
      @input='handleInput'
    />
    <Button
      @click='onStartDiscussClick'
      size='mini'
      style='border-radius: 8px; color: blue; width: calc(100% - 32px); margin-top: 16px;'
    >
      选择AGI成员开始圆桌论坛
    </Button>
    <View style='width: calc(100% - 32px);'>
      <Button
        @click='onAskClick'
        size='mini'
        style='border-radius: 8px; color: blue; width: 33.3%;'
      >
        AGI问一问
      </Button>
      <Button
        @click='onStartXiangshengClick'
        size='mini'
        style='border-radius: 8px; color: blue; width: 33.3%;'
      >
        AGI相声社
      </Button>
      <Button
        @click='onStartDuanziClick'
        size='mini'
        style='border-radius: 8px; color: blue; width: 33.3%;'
      >
        AGI有内涵
      </Button>
      <Button
        @click='onStartChatClick'
        size='mini'
        style='border-radius: 8px; color: blue; width: 33.3%;'
      >
        AGI轻松聊
      </Button>
      <Button
        @click='onStartChatClick'
        size='mini'
        style='border-radius: 8px; color: blue; width: 33.3%;'
      >
        AGI超有梗
      </Button>
      <Button
        @click='onStartChatClick'
        size='mini'
        style='border-radius: 8px; color: blue; width: 33.3%;'
      >
        AGI圈帮手
      </Button>
      <Button
        v-if='false'
        @click='onStartDiscussClick'
        size='mini'
        style='border-radius: 8px; color: blue; width: 33.3%;'
      >
        AGI脱口秀
      </Button>
      <Button
        v-if='false'
        @click='onStartDiscussClick'
        size='mini'
        style='border-radius: 8px; color: blue; width: 33.3%;'
      >
        AGI小品
      </Button>
      <Button
        v-if='false'
        @click='onStartDiscussClick'
        size='mini'
        style='border-radius: 8px; color: blue; width: 33.3%;'
      >
        AGI舞台剧
      </Button>
      <Button
        v-if='false'
        @click='onStartDiscussClick'
        size='mini'
        style='border-radius: 8px; color: blue; width: 33.3%;'
      >
        AGI小说
      </Button>
    </View>
    <View style='margin-top: 16px; width: calc(100% - 32px);'>
      <Button
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
      <View style=' width: calc(100% - 32px); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid gray;'>
        <View class='title'>{{ topicType }}</View>
        <View>
          <Button class='title plain-btn' size='mini' plain style='color: blue;' @click='onChangeTopicsClick' :loading='generating'>{{ generating ? '生成中...' : '换一批' }}</Button>
        </View>
      </View>
      <View v-if='topics.length' style='margin-top: 8px; width: calc(100% - 32px);'>
        <View v-for='_topic in topics' style='font-size: 14px; color: blue;' @click='onTopicClick(_topic)'>
          {{ _topic }}
        </View>
      </View>
      <View v-else class='title' style='height: 200px; display: flex; justify-content: center; align-items: center; width: calc(100% - 32px);'>
        AGI正在为您生成话题...
      </View>
    </View>
  </View>
</template>

<script setup lang='ts'>
import { dbBridge, entityBridge } from 'src/bridge'
import { search, seminar, xiangsheng } from 'src/localstores'
import { ref, watch, computed, onMounted } from 'vue'
import { View, Button, Text, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'

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
const topic = ref(_seminar.value ? _seminar.value.topic : initialTopics[Math.floor(Math.random() * initialTopics.length)])
const topicType = ref(presetClasses[0])
const historyTopics = ref([] as string[])
const topics = ref([] as string[])

const handleInput = (e: { detail: { value: string } }) => {
  topic.value = e.detail.value
}

watch(topic, () => {
  topic.value = topic.value.replace('\n', '')
})

const startSeminar = () => {
  // TODO: check if it's a valid topic
  seminar.Seminar.setTopic(topic.value)
  Taro.navigateTo({ url: '/pages/seminar/guest/GuestsPage' })
}

const onStartDiscussClick = () => {
  startSeminar()
}

const startSearch = () => {
  // TODO: check if it's a valid topic
  search.Search.setTopic(topic.value)
  Taro.navigateTo({ url: '/pages/search/SearchPage' })
}

const onAskClick = () => {
  startSearch()
}

const startXiangsheng = () => {
  // TODO: check if it's a valid topic
  xiangsheng.Xiangsheng.setTopic(topic.value)
  Taro.navigateTo({ url: '/pages/xiangsheng/role/RolesPage' })
}

const onStartXiangshengClick = () => {
  startXiangsheng()
}

const startDuanzi = () => {
  Taro.switchTab({ url: '/pages/duanzi/DuanziPage' })
}

const onStartDuanziClick = () => {
  startDuanzi()
}

const startChat = () => {

}

const onStartChatClick = () => {
  startChat()
}

const onTopicClick = (_topic: string) => {
  topic.value = _topic
  startSeminar()
}

const generating = ref(false)

const generateTopics = async () => {
  let clazz = topicType.value
  if (topicType.value === presetClasses.values[0]) clazz = '随机不同领域可以输出观点的话题'
  generating.value = true
  try {
    topics.value = await entityBridge.Topic.generateTopics(clazz, 10, historyTopics.value.map((el) => {
      return {
        participatorId: 0,
        content: el
      }
    }))
  } catch {
    setTimeout(() => {
      generateTopics()
    }, 1000)
    return
  }
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

onMounted(async () => {
  await generateTopics()
})

</script>

<style lang='sass'>
.plain-btn
  border: none !important
  background-color: transparent
  box-shadow: none !important
  padding: 0 !important

.plain-btn::after
  border: none !important
  content: none !important
</style>
