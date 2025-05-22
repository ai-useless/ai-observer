<template>
  <div class='text-center'>
    <div class='row full-width text-center justify-center items-center'>
      <q-avatar>
        <q-img :src='meipuAgiLogo' />
      </q-avatar>
      <h3 class='text-gradient-red q-ml-md' style='opacity: 0.6;'>
        可以玩的AGI
      </h3>
    </div>
    <q-input
      rounded
      outlined
      v-model='topic'
      placeholder='任何你想讨论的话题'
      type='textarea'
      style='width: 800px; font-size: 20px;'
      @keyup.enter.stop='onEnter'
    />
    <q-btn flat class='q-mt-lg full-width action-btn bg-gradient-blue text-white' rounded @click='onEnter'>
      选择AGI成员开始圆桌讨论
    </q-btn>
    <div style='margin-top: 24px; max-width: 800px;'>
      <q-btn
        flat
        dense
        :label='clazz'
        no-caps
        :class='[ "q-px-md border-radius-16px hover-slide-up-4px", clazz === topicType ? "border-gradient-bg-blue text-white" : "border-gradient-bg-white text-grey-7" ]'
        v-for='clazz in presetClasses'
        :key='clazz'
        @click='onGenerateTopics(clazz)'
        style='margin: 2px; padding: auto 16px;'
      />
    </div>
    <div style='margin-top: 24px; max-width: 800px;'>
      <div style='border-bottom: 1px solid gray;' class='row items-center'>
        <div style='color: gray;'>
          {{ topicType }}
        </div>
        <q-icon name='help' size='20px' class='text-gray-6 cursor-pointer q-ml-xs'>
          <q-tooltip style='font-size: 14px;'>
            您知道吗：这些话题都是AGI实时生成的。
          </q-tooltip>
        </q-icon>
        <q-space />
        <q-btn
          label='换一批'
          color='blue'
          flat
          dense
          @click='onChangeTopicsClick'
          :loading='generating'
        />
      </div>
      <div style='margin-top: 8px;' />
      <div
        v-for='_topic in topics'
        :key='_topic'
        style='color: blue; font-size: 16px;' class='text-left cursor-pointer'
        @click='onTopicClick(_topic)'
      >
        {{ _topic }}
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { entityBridge } from 'src/bridge'
import { seminar } from 'src/localstores'
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { meipuAgiLogo } from 'src/assets'

const initialTopics = [
  '油条的工艺与口味以及外观',
  '唐骏“学历门”诚信危机',
  '个税调整与两会热点',
  '移民潮及技术精英移民现象',
  '曹操墓真伪考古争议',
  '朝韩军事冲突可能性与中美博弈',
  '美乌再谈判局势',
  '美国政府“关门”及其影响',
  '奥巴马亚洲行意图分析',
  '日本武器出口政策',
  '印度新政对中印关系影响',
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
  '计算机密码学',
  '宇宙大爆炸',
  '诸子百家',
  '区块链技术',
  '莲蓬鬼话'
]

const topic = ref(seminar.Seminar.topic() || initialTopics[Math.floor(Math.random() * initialTopics.length)])
const topicType = ref(presetClasses[0])
const historyTopics = ref([] as string[])
const topics = ref([] as string[])

const router = useRouter()

watch(topic, () => {
  topic.value = topic.value.replace('\n', '')
})

const startSeminar = () => {
  // TODO: check if it's a valid topic
  seminar.Seminar.setTopic(topic.value)
  void router.push({ path: '/seminar/guests' })
}

const onEnter = () => {
  startSeminar()
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
      void generateTopics()
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
  seminar.Seminar.setTopic(topic.value)
  await generateTopics()
})

</script>

<style scoped lang='sass'>
</style>
