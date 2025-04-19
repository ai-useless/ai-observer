<template>
  <div class='text-center'>
    <h3 class='text-grey-9'>
      What would you like to dig ?
    </h3>
    <q-input
      rounded
      outlined
      v-model='topic'
      placeholder='Key in any topic you are interesting in'
      type='textarea'
      style='width: 800px; font-size: 20px;'
      @keyup.enter.stop='onEnter'
    />
    <div style='margin-top: 24px;'>
      <q-btn
        rounded
        flat
        label='Random topic'
        no-caps
        class='text-grey-7 border'
      />
      <q-btn
        rounded
        flat
        label='History topic'
        no-caps
        class='text-grey-7 border'
        style='margin-left: 8px;'
      />
      <q-btn
        rounded
        flat
        label='The World War II'
        no-caps
        class='text-grey-7 border'
        style='margin-left: 8px;'
      />
      <q-btn
        rounded
        flat
        label='Big Countries Battle'
        no-caps
        class='text-grey-7 border'
        style='margin-left: 8px;'
      />
    </div>
  </div>
</template>

<script setup lang='ts'>
import { dbBridge } from 'src/bridge'
import { seminar, setting } from 'src/localstores'
import { ref, watch } from 'vue'

const initialTopics = [
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

// TODO: random initial topic
const topic = ref(initialTopics[Math.floor(Math.random() * initialTopics.length)])

watch(topic, () => {
  topic.value = topic.value.replace('\n', '')
})

const onEnter = async () => {
  const _uid = await dbBridge._Seminar.create(topic.value)
  seminar.Seminar.setSeminar(_uid)
  setting.Setting.setInScratch(false)
}

</script>

<style scoped lang='sass'>
.border
  border: 1px solid $red-3
</style>
