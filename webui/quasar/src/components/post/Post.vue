<template>
  <q-page>
    <div style='width: 100%; height: 100vh;' class='flex justify-center items-center'>
      <div style='height: 100vh; width: min(100%, 600px);' class='bg-grey-2'>
        <q-scroll-area
          style='height: calc(100% - 56px - 32px - 16px - 16px); width: 100%; padding: 8px 16px;'
          ref='chatBox'
          :bar-style='{ width: "2px" }'
          :thumb-style='{ width: "2px" }'
          class='cursor-pointer'
        >
          <div v-for='([_prompt, _images], index) in images' :key='index' :style='{borderBottom: "1px solid lightgray", padding: "8px 0", width: "100%"}'>
            <div :style='{width: "100%", height: containerHeight(_images.total, _images.ratio)}'>
              <div v-if='_images.images.length' style='width: 100%; display: flex;'>
                <div
                  v-for='(image, _index) in _images.images.slice(0, imagesPerRow(_images.total))'
                  :key='_index'
                  @click='onPreviewImageClick(image.imageUrl, [..._images.images.map((el) => el.imageUrl), ...(_images.posterPath ? [_images.posterPath] : [])])'
                  :style='{width: imageWidth(_images.total), height: imageHeight(_images.total, _images.ratio)}'
                >
                  <q-img
                    :src='image.imageUrl'
                    mode='widthFix'
                    :style='{width: "100%", height: imageHeight(_images.total, _images.ratio)}'
                  />
                </div>
              </div>
              <div v-if='_images.images.length > imagesPerRow(_images.total)' style='width: 100%; display: flex;'>
                <div
                  v-for='(image, index) in _images.images.slice(imagesPerRow(_images.total), imagesPerRow(_images.total) * 2)'
                  :key='index'
                  @click='onPreviewImageClick(image.imageUrl, [..._images.images.map((el) => el.imageUrl), ...(_images.posterPath ? [_images.posterPath] : [])])'
                  :style='{width: imageWidth(_images.total), height: imageHeight(_images.total, _images.ratio)}'
                >
                  <q-img
                    :src='image.imageUrl'
                    mode='widthFix'
                    :style='{width: "100%", height: imageHeight(_images.total, _images.ratio)}'
                  />
                </div>
              </div>
              <div v-if='_images.images.length > imagesPerRow(_images.total) * 2' style='width: 100%; display: flex;'>
                <div
                  v-for='(image, index) in _images.images.slice(imagesPerRow(_images.total) * 2)'
                  :key='index'
                  @click='onPreviewImageClick(image.imageUrl, [..._images.images.map((el) => el.imageUrl), ...(_images.posterPath ? [_images.posterPath] : [])])'
                  :style='{width: imageWidth(_images.total), height: imageHeight(_images.total, _images.ratio)}'
                >
                  <q-img
                    :src='image.imageUrl'
                    mode='widthFix'
                    :style='{width: "100%", height: imageHeight(_images.total, _images.ratio)}'
                  />
                </div>
              </div>
            </div>
            <div style='margin-top: 8px; font-size: 12px; color: gray;'>
              {{ _prompt }}
            </div>
            <div style='display: flex; margin-top: 4px; flex-direction: row-reverse;'>
              <div>
                <q-btn
                  plain
                  style='width: 24px; height: 24px;'
                  :disabled='_images.successes < _images.total'
                >
                  <q-icon name='share' style='width: 16px; height: 16px;' />
                </q-btn>
              </div>
              <div>
                <q-btn
                  v-if='_images.responds < _images.total'
                  plain
                  style='margin-left: 4px; font-size: 12px; color: gray; height: 24px; margin-right: 4px;'
                  :loading='true'
                >
                  {{ _images.total - _images.responds }}张美图生成中...
                </q-btn>
              </div>
              <div v-if='_images.errors > 0' style='display: flex; margin-right: 4px; height: 26px; justify-content: center; align-items: center;'>
                <q-icon name='fail' style='width: 16px; height: 16px;' />
                <div style='font-size: 12px; color: gray; margin-left: 4px;'>
                  {{ _images.errors }}失败
                </div>
              </div>
              <div v-if='_images.successes > 0' style='display: flex; margin-right: 4px; height: 26px; justify-content: center; align-items: center;'>
                <q-icon name='check' style='width: 16px; height: 16px;' />
                <div style='font-size: 12px; color: gray; margin-left: 4px;'>
                  {{ _images.successes }}成功
                </div>
              </div>
            </div>
          </div>
        </q-scroll-area>
        <div class='flex justify-center items-center'>
          <BottomFixInput
            v-model='inputPrompt'
            placeholder='随手写下你此刻的心情~'
            @enter='onPromptEnter'
            :max-width='560'
          />
        </div>
        <Canvas canvasId='canvas-1-1' style='width: 900px; height: 900px; position: fixed; left: 100000px; z-index: -1000; opacity: 0;' />
        <Canvas canvasId='canvas-4-3' style='width: 900px; height: 675px; position: fixed; left: 100000px; z-index: -1000; opacity: 0;' />
        <Canvas canvasId='canvas-16-9' style='width: 900px; height: 507px; position: fixed; left: 100000px; z-index: -1000; opacity: 0;' />
      </div>
    </div>
  </q-page>
  <q-dialog v-model='configuring' @close='onConfigureClose'>
    <AtModalHeader>创作设置</AtModalHeader>
    <AtModalContent>
      <div>
        <div style='display: flex; line-height: 18px;'>
          <div style='width: 60%; display: flex;'>
            <div style='font-size: 14px; color: gray;'>图片数</div>
            <div style='font-size: 12px; color: gray;'>(最多9张)</div>
          </div>
          <div style='width: 40%; display: flex; flex-direction: row-reverse;'>
            <Input :value='imageNumberStr' type='number' style='text-align: right; border: 1px solid lightgray; padding: 0 4px; border-radius: 4px;' @input='onImageNumberInput' />
          </div>
        </div>
        <div style='display: flex; line-height: 18px; margin-top: 4px;'>
          <div style='width: 60%; display: flex;'>
            <div style='font-size: 14px; color: gray;'>宽高比</div>
          </div>
          <div style='width: 40%; display: flex; flex-direction: row-reverse;'>
            <div :style='{fontSize: "12px", backgroundColor: imageRatio === "1:1" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageRatioChange("1:1")'>1:1</div>
            <div :style='{fontSize: "12px", backgroundColor: imageRatio === "4:3" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageRatioChange("4:3")'>4:3</div>
            <div :style='{fontSize: "12px", backgroundColor: imageRatio === "16:9" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageRatioChange("16:9")'>16:9</div>
          </div>
        </div>
        <div style='display: flex; line-height: 18px; margin-top: 4px;'>
          <div style='width: 60%; display: flex;'>
            <div style='font-size: 14px; color: gray;'>清晰度</div>
          </div>
          <div style='width: 40%; display: flex; flex-direction: row-reverse;'>
            <div :style='{fontSize: "12px", backgroundColor: imageResolution === "标清" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageResolutionChange("标清")'>标清</div>
            <div :style='{fontSize: "12px", backgroundColor: imageResolution === "高清" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageResolutionChange("高清")'>高清</div>
          </div>
        </div>
        <div style='display: flex; line-height: 18px; margin-top: 4px;'>
          <div style='width: 30%; display: flex;'>
            <div style='font-size: 14px; color: gray;'>图片风格</div>
          </div>
          <div style='width: 70%;'>
            <div style='display: flex; flex-wrap: wrap;'>
              <div v-for='(style, index) in styles' :key='index' @click='onStyleClick(style)'>
                <div style='font-size: 12px; color: blue; margin-left: 4px;'>{{ style }}</div>
              </div>
            </div>
            <div style='margin-top: 8px; display: flex; flex-direction: row;'>
              <Input :value='imageStyle' placeholder='你喜欢的图片风格' style='border: 1px solid lightgray; margin-left: 4px; border-radius: 4px; padding: 0 4px;' @input='onImageStyleInput' />
              <div style='font-size: 12px; color: blue; margin-left: 4px; width: 36px;' @click='onStyleClick(imageStyle)'>确定</div>
            </div>
            <div style='margin-top: 4px;' />
            <div style='display: flex; flex-wrap: wrap;'>
              <div v-for='(style, index) in imageStyles' :key='index' style='margin-left: 4px; border-radius: 4px; border: 1px solid lightblue; margin-top: 4px;' @click='onSelectedStyleClick(style)'>
                <div style='font-size: 12px; color: gray; padding: 0 4px;'>{{ style }}</div>
                <div style='font-size: 10px; color: gray; margin-right: 4px;'>| 删除</div>
              </div>
            </div>
          </div>
        </div>
        <div style='display: flex; line-height: 18px; margin-top: 4px;'>
          <div style='width: 30%; display: flex;'>
            <div style='font-size: 14px; color: gray;'>
              文案要求
            </div>
          </div>
          <div style='width: 70%;'>
            <div>
              <div v-for='(_prompt, index) in presetStyles' :key='index' @click='onPromptStyleClick(_prompt)'>
                <div style='font-size: 12px; color: blue; margin-left: 4px;'>{{ _prompt }}</div>
              </div>
            </div>
            <div style='margin-top: 8px; display: flex; flex-direction: row;'>
              <Input :value='promptStyle' placeholder='你喜欢的文案要求' style='border: 1px solid lightgray; margin-left: 4px; border-radius: 4px; padding: 0 4px;' @input='onPromptStyleInput' />
            </div>
          </div>
        </div>
        <div style='display: flex; line-height: 18px; margin-top: 8px;'>
          <div style='width: 60%; display: flex;'>
            <div style='font-size: 14px; color: gray;'>文案字数</div>
            <div style='font-size: 12px; color: gray;'>(20~200字)</div>
          </div>
          <div style='width: 40%; display: flex; flex-direction: row-reverse;'>
            <Input :value='letterNumberStr' type='number' style='text-align: right; border: 1px solid lightgray; padding: 0 4px; border-radius: 4px;' @input='onLetterNumberInput' />
          </div>
        </div>
      </div>
    </AtModalContent>
    <AtModalAction>
      <q-btn @click='onConfirmConfigureClick'>
        确定
      </q-btn>
      <q-btn @click='onCancelConfigureClick'>
        取消
      </q-btn>
    </AtModalAction>
  </q-dialog>
</template>

<script setup lang='ts'>
import { onMounted, ref, watch } from 'vue'
import { dbBridge, entityBridge } from 'src/bridge'
import { model, setting } from 'src/localstores'

import BottomFixInput from '../input/BottomFixInput.vue'

const audioInput = ref(false)
const audioError = ref('')

const generating = ref(false)
const imageGenerating = ref(false)

const configuring = ref(false)
const imageNumber = ref(1)
const imageNumberStr = ref(imageNumber.value.toString())
const letterNumber = ref(20)
const letterNumberStr = ref(letterNumber.value.toString())
const imageRatio = ref('4:3')
const imageResolution = ref('高清')

const cachePrompts = ref([] as string[])

const styles = [
  '漫画',
  '搞笑',
  '清新唯美',
  '二次元',
  '中二',
  '黑暗',
  '忧伤',
  '科技',
  '重金属',
  '摇滚'
]
const imageStyles = ref([styles[0]] as string[])
const imageStyle = ref(styles[0])

const presetStyles = [
  '带典故的心灵鸡汤',
  '和今天的黄历相符的心情描述',
  '带典故，充满人生哲理',
  '小人物的日常感悟',
  '让人捧腹大笑',
  '适合给小朋友做科普',
  '松尾芭蕉的俳句'
]
const prompt = ref('最是仓皇辞庙日，教坊犹奏离别歌，垂泪对宫娥！')
const inputPrompt = ref(prompt.value)
const promptStyle = ref('带典故，充满人生哲理')
const timelinePrompt = ref(prompt.value)
const timelinePosterPath = ref(undefined as unknown as string)

interface ImageData {
  imageUrl: string
  imagePath: string
}
interface PromptImage {
  imagePrompt: string
  total: number
  ratio: string
  responds: number
  successes: number
  errors: number
  posterPath?: string
  images: ImageData[]
}
const images = ref(new Map<string, PromptImage>())

const imageWidth = (count: number) => {
  if (count === 1) return '100%'
  else if (count === 2 || count === 4) return '50%'
  else return '33.3%'
}

const imageHeightNumber = (count: number) => {
  const baseHeight = 300

  if (count === 1) return baseHeight
  else if (count === 2 || count === 4) return Math.floor(baseHeight / 2)
  else return Math.floor(baseHeight / 3)
}

const imageHeight = (count: number, ratio: string) => {
  const baseHeight = imageHeightNumber(count)

  if (ratio === '1:1') return `${baseHeight}px`
  else if (ratio === '4:3') return `${Math.floor(baseHeight * 0.75)}px`
  else return `${Math.floor(baseHeight * 9 / 16)}px`
}

const containerHeight = (count: number, ratio: string) => {
  const baseHeight = imageHeightNumber(count) * imageRows(count)

  if (ratio === '1:1') return `${baseHeight}px`
  else if (ratio === '4:3') return `${Math.floor(baseHeight * 0.75)}px`
  else return `${Math.floor(baseHeight * 9 / 16)}px`
}

const imagesPerRow = (count: number) => {
  if (count <= 3) return count
  else if (count === 4) return 2
  else return 3
}

const imageRows = (count: number) => {
  if (count <= 3) return 1
  else if (count === 4) return 2
  else return Math.ceil(count / 3)
}

const prepareShareData = (_prompt: string) => {
  const _images = images.value.get(_prompt) as PromptImage

  sharePoster(_prompt).then((posterPath) => {
    _images.posterPath = posterPath as string
    timelinePrompt.value = _prompt
    timelinePosterPath.value = posterPath as string
    imageGenerating.value = false
  }).catch((e) => {
    imageGenerating.value = false
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed generate poster: ${e}`)
  })
}

const lruPromptCache = (_prompt: string) => {
  cachePrompts.value.push(_prompt)

  if (cachePrompts.value.length < 20) {
    prepareShareData(_prompt)
    return
  }

  cachePrompts.value = cachePrompts.value.slice(1)
  prepareShareData(_prompt)
}

const cacheImageUrl = (_prompt: string, _image: string) => {
  console.log(_image)
  lruPromptCache(_prompt)
}

const generate = (_prompt: string, style: string) => {
  const _images = images.value.get(_prompt) as PromptImage

  entityBridge.EImage.generate(_images.imagePrompt, style, false, '', imageResolution.value === '高清', imageRatio.value, (_image: string) => {
    _images.responds += 1
    _images.successes += 1
    cacheImageUrl(_prompt, _image)
  }, () => {
    _images.responds += 1
    _images.errors += 1
    images.value.set(_prompt, _images)
  })
}

const refinePrompt = async (_prompt: string) => {
  const _images = images.value.get(_prompt) as PromptImage

  entityBridge.EChat.refinePrompt(_prompt, await dbBridge._Model.topicModelId()).then((__prompt) => {
    generating.value = false
    if (!__prompt) {
      imageGenerating.value = false
      return
    }
    _images.imagePrompt = __prompt
    images.value.set(_prompt, _images)
    for (let i = 0; i < imageNumber.value; i++) {
      generate(_prompt, imageStyles.value[i % imageStyles.value.length])
    }
  }).catch((e) => {
    generating.value = false
    imageGenerating.value = false
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed refine prompt: ${e}`)
    setTimeout(() => {
      void refinePrompt(_prompt)
    }, 1000)
  })
}

const refineText = async (_prompt: string) => {
  generating.value = true
  imageGenerating.value = true

  entityBridge.EChat.refineText(_prompt, promptStyle.value, letterNumber.value, await dbBridge._Model.topicModelId()).then((__prompt) => {
    if (!__prompt) {
      return
    }

    const _images = images.value.get(__prompt) || {
      imagePrompt: __prompt,
      total: imageNumber.value,
      ratio: imageRatio.value,
      successes: 0,
      errors: 0,
      responds: 0,
      images: []
    } as PromptImage
    images.value.set(__prompt, _images)

    void refinePrompt(__prompt)
  }).catch((e) => {
    generating.value = false
    imageGenerating.value = false
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed refine text: ${e}`)
    setTimeout(() => {
      void refineText(_prompt)
    }, 1000)
  })
}

watch(prompt, () => {
  if (!audioInput.value || !prompt.value || !prompt.value.length) return

  if (generating.value || imageGenerating.value) return
  configuring.value = true
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

  audioError.value = ''
})

const onPromptEnter = (_prompt: string) => {
  prompt.value = _prompt

  if (generating.value || imageGenerating.value) return
  configuring.value = true
}

const onConfirmConfigureClick = async () => {
  configuring.value = false
  await refineText(prompt.value)
}

const onCancelConfigureClick = () => {
  configuring.value = false
}

const onConfigureClose = () => {
  configuring.value = false
}

const onStyleClick = (style: string) => {
  if (imageStyles.value.includes(style)) return

  if (imageStyles.value.length >= imageNumber.value) {
    imageStyles.value[imageNumber.value - 1] = style
  } else {
    imageStyles.value.push(style)
  }
  imageStyle.value = ''
}

const onSelectedStyleClick = (style: string) => {
  const index = imageStyles.value.findIndex((el) => el === style)
  imageStyles.value = [...imageStyles.value.slice(0, index), ...imageStyles.value.slice(index + 1)]
}

const onImageRatioChange = (value: string) => {
  imageRatio.value = value
}

const onImageResolutionChange = (value: string) => {
  imageResolution.value = value
}

const onImageStyleInput = (e: { detail: { value: string } }) => {
  imageStyle.value = e.detail.value
}

const onImageNumberInput = (e: { detail: { value: any } }) => {
  const str = e.detail.value as string
  imageNumberStr.value = str
  imageNumber.value = Number(e.detail.value)
  imageNumber.value = imageNumber.value > 9 || imageNumber.value <= 0 ? 9 : imageNumber.value
}

const onLetterNumberInput = (e: { detail: { value: any } }) => {
  const str = e.detail.value as string
  letterNumberStr.value = str
  letterNumber.value = Number(e.detail.value)
  letterNumber.value = letterNumber.value > 200 ? 200 : letterNumber.value < 20 ? 20 : letterNumber.value
}

const onPromptStyleClick = (_prompt: string) => {
  promptStyle.value = _prompt
}

const onPromptStyleInput = (e: { detail: { value: string } }) => {
  promptStyle.value = e.detail.value
}

/*
const posterImageWidth = (count: number) => {
  let baseWidth = 900
  if (count === 1) return baseWidth
  else if (count === 2 || count === 4) return Math.floor(baseWidth / 2)
  else return Math.floor(baseWidth / 3)
}

const posterImageHeight = (count: number, ratio: string) => {
  const width = posterImageWidth(count)

  if (ratio === '1:1') return width
  else if (ratio === '4:3') return Math.floor(width * 0.75)
  else return Math.floor(width * 9 / 16)
}
*/

onMounted(() => {
  setting.Setting.setCurrentMenu('post')

  model.Model.getModels(() => {
    void refineText(prompt.value)
  })
})

const sharePoster = async (title: string) => {
  console.log(title)
  return Promise.reject('Not implemented')
}

const onPreviewImageClick = (image: string, _images: string[]) => {
  console.log(image, _images)
}

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
