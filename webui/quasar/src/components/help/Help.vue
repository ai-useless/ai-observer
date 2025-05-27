<template>
  <q-page>
    <div :style='{width: "100%" }' class='flex justify-center items-center'>
      <q-resize-observer @resize='onWindowResize' />
      <div style='height: 100%; width: 960px; max-width: 100%;'>
        <q-card class='bg-gradient-blue no-border-radius'>
          <q-card-section>
            <div class='flex justify-center items-center' style='height: 240px;'>
              <div class='text-center'>
                <div class='text-white text-bold cursor-pointer' style='font-size: 40px;'>
                  你可能想知道的
                </div>
                <q-btn
                  class='action-btn text-grey-9 q-mt-lg border-gradient-bg-white full-width border-radius-16px'
                  flat
                  dense
                  @click='onAskClick'
                >
                  去问一下
                </q-btn>
              </div>
            </div>
          </q-card-section>
          <q-card-actions>
            <div class='row full-width'>
              <q-space />
              <q-btn
                flat
                dense
                rounded
                color='white'
                label='用户手册'
              />
              <q-btn
                flat
                dense
                rounded
                color='white'
                label='隐私协议'
              />
            </div>
          </q-card-actions>
        </q-card>

        <q-list padding class='q-mt-lg' style='margin-bottom: 48px;'>
          <div
            v-for='(item, index) in items'
            :key='index'
          >
            <q-expansion-item
              :model-value='expandedIndex === index'
              dense
              :label='item.title'
              header-style='font-size: 18px; border-radius: 8px; height: 64px;'
              @update:model-value='(v) => onItemExpanded(index, v)'
            >
              <q-card>
                <div class='q-px-md text-grey-8 q-pb-md'>
                  {{ item.content }}
                </div>
              </q-card>
            </q-expansion-item>
            <q-separator />
          </div>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<script setup lang='ts'>
import { ref } from 'vue'

const contentHeight = ref(0)

const expandedIndex = ref(-1)

const onWindowResize = (size: { width: number }) => {
  contentHeight.value = size.width
}

const onAskClick = () => {
  // TODO
}

interface ListItem {
  title: string
  content: string
}

const items = ref<ListItem[]>([
  {
    title: '没谱儿AGI是免费的吗？',
    content: '没谱儿AGI提供免费计划。登录用户在当前阶段可以免费使用和观看应用内的所有AGI功能和内容。没谱儿AGI下一阶段将推出不同的订阅套餐，为用户提供高质量内容生成、数字人、视频生成、一键分享、存储计划、栏目预约等高级功能，敬请期待！'
  },
  {
    title: '早鸟用户是否拥有额外福利？',
    content: '早鸟用户将会拥有免费的内容生成时间。在订阅套餐上线之后，早鸟用户将拥有为期三个月的无限量免费生成额度，并且可以免费存储高达20G的内容。早鸟用户同样拥有很多高级功能的早期使用权限，例如一键分享、栏目预约、数字人、实时视频等。'
  },
  {
    title: '没谱儿AGI支持哪些设备？',
    content: '没谱儿AGI当前已支持网页应用和微信小程序。移动版本已经在计划中，将会很快上线，敬请期待！'
  },
  {
    title: '没谱儿AGI支持自己创建角色吗？',
    content: '完全正确！没谱儿AGI希望大家在这里能尽情玩自己喜欢的声音和角色，只要您确保您拥有声音版权，您就可以用这些声音来创建各种各样的角色。'
  },
  {
    title: '没谱儿AGI的角色支持方言吗？',
    content: '这是没谱儿AGI的另外一大特色：我们支持各种方言！您上传的声音或许只能某一种口音，但是您完全可以在选择该角色表演的时候赋予角色不同的口音！'
  },
  {
    title: '没谱儿AGI可以生成什么样的内容？',
    content: '任何符合公序良俗、国家政策的健康的内容。'
  },
  {
    title: '没谱儿AGI可以创建什么样的角色和音频？',
    content: '您需要确保拥有用于创建角色的声音和头像版权，并且使用的声音和头像需要符合公序良俗和国家政策。没谱儿AGI的管理员会对创建的角色进行审核并拒绝那些违背规则的角色。没谱儿AGI鼓励用户举报那些有问题的角色，管理员核实过后会将被举报的角色禁用。'
  },
  {
    title: '我创建的角色是我独有的吗？',
    content: '道歉！在当前阶段，任何人创建的角色都是全平台可见的。我们将来将会支持用户独有的角色。'
  },
  {
    title: '我还能找到我听过的内容吗？',
    content: '道歉+1！当前版本我们不存储任何内容，内容都是实时生成的。我们将来将会上线存储计划，让用户可以存储自己听过的感兴趣的内容。'
  },
  {
    title: '我可以将感兴趣的内容分享给朋友吗？',
    content: '道歉+1！当前版本暂时还不能分享，但是将来我们将会支持将觉得有趣的内容分享给朋友。'
  },
  {
    title: '我可以邀请好友一起听好玩的内容吗？',
    content: '道歉+1！当前版本我们并不能支持在线上一起听好玩的内容，但是将来我们将会支持剧场版本，使得好朋友可以一起观看有趣的内容。'
  },
  {
    title: '我能找到跟我观看过类似内容的好友吗？',
    content: '道歉+1！当前版本我们没有做任何用户观看过的内容整理和收集，因此你并不能找到跟你看过同样内容的好友。我们并不确定将来是否需要支持这一功能，当然，这完全取决于有多少人需要。'
  }
])

const onItemExpanded = (index: number, expanded: boolean) => {
  if (expanded) {
    expandedIndex.value = index
  } else if (expandedIndex.value === index) {
    expandedIndex.value = -1
  }
}

</script>
