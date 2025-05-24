<template>
  <q-page>
    <div style='width: 100%; height: 100vh;' class='flex justify-center items-center'>
      <div style='height: 100vh; width: min(100%, 960px);' class='bg-grey-2'>
        <q-resize-observer @resize='onContentBoxResize' />
        <q-scroll-area
          style='height: calc(100% - 64px); width: 100%;'
          ref='chatBox'
          :bar-style='{ width: "2px" }'
          :thumb-style='{ width: "2px" }'
          class='cursor-pointer'
        >
          <div v-for='([_prompt, _images], index) in images' :key='index' style='width: 100%;'>
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
                    :style='{width: "100%", height: imageHeight(_images.total, _images.ratio)}'
                  />
                </div>
              </div>
              <div v-if='_images.images.length > imagesPerRow(_images.total)' style='width: 100%; display: flex;'>
                <div
                  v-for='(image, _index) in _images.images.slice(imagesPerRow(_images.total), imagesPerRow(_images.total) * 2)'
                  :key='_index'
                  @click='onPreviewImageClick(image.imageUrl, [..._images.images.map((el) => el.imageUrl), ...(_images.posterPath ? [_images.posterPath] : [])])'
                  :style='{width: imageWidth(_images.total), height: imageHeight(_images.total, _images.ratio)}'
                >
                  <q-img
                    :src='image.imageUrl'
                    :style='{width: "100%", height: imageHeight(_images.total, _images.ratio)}'
                  />
                </div>
              </div>
              <div v-if='_images.images.length > imagesPerRow(_images.total) * 2' style='width: 100%; display: flex;'>
                <div
                  v-for='(image, _index) in _images.images.slice(imagesPerRow(_images.total) * 2)'
                  :key='_index'
                  @click='onPreviewImageClick(image.imageUrl, [..._images.images.map((el) => el.imageUrl), ...(_images.posterPath ? [_images.posterPath] : [])])'
                  :style='{width: imageWidth(_images.total), height: imageHeight(_images.total, _images.ratio)}'
                >
                  <q-img
                    :src='image.imageUrl'
                    :style='{width: "100%", height: imageHeight(_images.total, _images.ratio)}'
                  />
                </div>
              </div>
            </div>
            <div style='font-size: 16px;' class='text-black q-px-md q-py-lg'>
              {{ _prompt }}
            </div>
            <div style='display: flex; flex-direction: row-reverse; align-items: center;' class='q-px-md q-pb-md'>
              <div>
                <q-btn
                  flat
                  dense
                  plain
                  rounded
                  :disabled='_images.successes < _images.total'
                >
                  <q-icon color='grey-9' name='share' size='18px' />
                </q-btn>
              </div>
              <div v-if='_images.responds < _images.total' style='width: 128px'>
                <q-btn
                  flat
                  dense
                  :loading='true'
                  color='grey-6'
                  class='full-width q-ml-xs'
                >
                  <template #loading>
                    <div class='row full-width flex justify-center items-center'>
                      <q-spinner-ball size='20px' class='q-mr-xs' />
                      {{ _images.total - _images.responds }}张美图生成中...
                    </div>
                  </template>
                </q-btn>
              </div>
              <div v-if='_images.errors > 0' style='display: flex; margin-right: 4px; height: 26px; justify-content: center; align-items: center;'>
                <q-icon name='fail' color='red' style='width: 16px; height: 16px;' />
                <div style='font-size: 12px; color: gray; margin-left: 4px;'>
                  {{ _images.errors }}失败
                </div>
              </div>
              <div v-if='_images.successes > 0' style='display: flex; margin-right: 4px; height: 26px; justify-content: center; align-items: center;'>
                <q-icon name='check' color='green-6' size='18px' />
                <div style='font-size: 12px; color: gray; margin-left: 4px;'>
                  {{ _images.successes }}成功
                </div>
              </div>
            </div>
            <q-resize-observer @resize='onChatBoxResize' />
          </div>
        </q-scroll-area>
        <div class='flex justify-center items-center'>
          <BottomFixInput
            v-model='inputPrompt'
            placeholder='随手写下你此刻的心情~'
            @enter='onPromptEnter'
            :max-width='720'
          />
        </div>
        <canvas ref='canvas1x1' style='width: 900px; height: 900px; position: fixed; left: 100000px; z-index: -1000; opacity: 0;' />
        <canvas ref='canvas4x3' style='width: 900px; height: 675px; position: fixed; left: 100000px; z-index: -1000; opacity: 0;' />
        <canvas ref='canvas16x9' style='width: 900px; height: 507px; position: fixed; left: 100000px; z-index: -1000; opacity: 0;' />
      </div>
    </div>
  </q-page>
  <q-dialog v-model='configuring' @close='onConfigureClose'>
    <q-card @keydown.enter='onMenuEnter' tabindex='0' ref='menuPanel' style='outline:none;'>
      <q-card-section class='text-bold'>
        创作设置
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div>
          <div style='display: flex; line-height: 18px;'>
            <div style='width: 60%; display: flex;'>
              <div style='font-size: 14px; color: gray;'>
                图片数
              </div>
              <div style='font-size: 12px; color: gray;'>
                (最多9张)
              </div>
            </div>
            <div style='width: 40%; display: flex; flex-direction: row-reverse;'>
              <input v-model='imageNumber' type='number' style='text-align: right; border: 1px solid lightgray; padding: 0 4px; border-radius: 4px;'>
            </div>
          </div>
          <div style='display: flex; line-height: 18px; margin-top: 4px;'>
            <div style='width: 60%; display: flex;'>
              <div style='font-size: 14px; color: gray;'>
                宽高比
              </div>
            </div>
            <div style='width: 40%; display: flex; flex-direction: row-reverse;'>
              <div class='cursor-pointer' :style='{fontSize: "12px", backgroundColor: imageRatio === "1:1" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageRatioChange("1:1")'>
                1:1
              </div>
              <div class='cursor-pointer' :style='{fontSize: "12px", backgroundColor: imageRatio === "4:3" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageRatioChange("4:3")'>
                4:3
              </div>
              <div class='cursor-pointer' :style='{fontSize: "12px", backgroundColor: imageRatio === "16:9" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageRatioChange("16:9")'>
                16:9
              </div>
            </div>
          </div>
          <div style='display: flex; line-height: 18px; margin-top: 4px;'>
            <div style='width: 60%; display: flex;'>
              <div style='font-size: 14px; color: gray;'>
                清晰度
              </div>
            </div>
            <div style='width: 40%; display: flex; flex-direction: row-reverse;'>
              <div class='cursor-pointer' :style='{fontSize: "12px", backgroundColor: imageResolution === "标清" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageResolutionChange("标清")'>
                标清
              </div>
              <div class='cursor-pointer' :style='{fontSize: "12px", backgroundColor: imageResolution === "高清" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageResolutionChange("高清")'>
                高清
              </div>
            </div>
          </div>
          <div style='display: flex; line-height: 18px; margin-top: 4px;'>
            <div style='width: 30%; display: flex;'>
              <div style='font-size: 14px; color: gray;'>
                图片风格
              </div>
            </div>
            <div style='width: 70%;'>
              <div style='display: flex; flex-wrap: wrap;'>
                <div v-for='(style, index) in styles' :key='index' @click='onStyleClick(style)'>
                  <div style='font-size: 12px; color: blue; margin-right: 4px;' class='cursor-pointer'>
                    {{ style }}
                  </div>
                </div>
              </div>
              <div style='margin-top: 8px; display: flex; flex-direction: row;' class='full-width'>
                <input
                  v-model='imageStyle'
                  placeholder='你喜欢的图片风格'
                  style='border: 1px solid lightgray; border-radius: 4px;'
                  @keydown.enter='onStyleClick(imageStyle)'
                  class='full-width'
                >
              </div>
              <div style='margin-top: 4px;' />
              <div style='display: flex; flex-wrap: wrap;'>
                <div
                  v-for='(style, index) in imageStyles'
                  :key='index' style='margin-right: 4px; border-radius: 4px; border: 1px solid lightblue; margin-top: 4px;'
                  @click='onSelectedStyleClick(style)'
                  class='row'
                >
                  <div style='font-size: 12px; color: gray; padding: 0 4px;'>
                    {{ style }}
                  </div>
                  <div style='font-size: 10px; color: gray; margin-right: 4px;'>
                    | 删除
                  </div>
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
                  <div style='font-size: 12px; color: blue; margin-right: 4px;' class='cursor-pointer'>
                    {{ _prompt }}
                  </div>
                </div>
              </div>
              <div style='margin-top: 8px; display: flex; flex-direction: row;'>
                <input
                  v-model='promptStyle'
                  placeholder='你喜欢的文案要求'
                  style='border: 1px solid lightgray; border-radius: 4px;'
                  @keydown.enter='onPromptStyleClick(promptStyle)'
                  class='full-width'
                >
              </div>
            </div>
          </div>
          <div style='display: flex; line-height: 18px; margin-top: 8px;'>
            <div style='width: 60%; display: flex;'>
              <div style='font-size: 14px; color: gray;'>
                文案字数
              </div>
              <div style='font-size: 12px; color: gray;'>
                (20~200字)
              </div>
            </div>
            <div style='width: 40%; display: flex; flex-direction: row-reverse;'>
              <input v-model='letterNumber' type='number' style='text-align: right; border: 1px solid lightgray; padding: 0 4px; border-radius: 4px;'>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-actions class='q-pb-md'>
        <div class='full-width'>
          <q-btn
            flat
            rounded
            @click='onConfirmConfigureClick'
            style='width: 100%'
            class='bg-gradient-blue text-white'
            :tabindex='0'
          >
            确定
          </q-btn>
          <q-btn
            flat
            rounded
            @click='onCancelConfigureClick'
            style='width: 100%'
            class='border-gradient-bg-white q-mt-sm'
          >
            取消
          </q-btn>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model='previewingImage' maximized>
    <q-card style='width: min(100%, 1280px); max-height: min(calc(100% - 64px), 1280px);'>
      <q-carousel
        v-model='previewImageIndex'
        animated
        swipeable
        control-color='white'
        navigation
        navigation-position='bottom'
        class='full-height'
        handle-arrow-keys
      >
        <q-carousel-slide
          v-for='(_image, index) in previewImages'
          :key='index'
          :name='index'
          :img-src='_image'
        />
      </q-carousel>
    </q-card>
  </q-dialog>
</template>

<script setup lang='ts'>
import { nextTick, onMounted, ref, watch } from 'vue'
import { dbBridge, entityBridge } from 'src/bridge'
import { model, setting } from 'src/localstores'
import { QCard, QScrollArea } from 'quasar'

import BottomFixInput from '../input/BottomFixInput.vue'

const audioInput = ref(false)
const audioError = ref('')

const generating = ref(false)
const imageGenerating = ref(false)
const contentWidth = ref(0)

const previewingImage = ref(false)
const previewImageIndex = ref(0)
const previewImages = ref([] as string[])

const configuring = ref(false)
const imageNumber = ref(1)
const letterNumber = ref(20)
const imageRatio = ref('4:3')
const imageResolution = ref('高清')

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

const menuPanel = ref<QCard>()
const chatBox = ref<QScrollArea>()
const canvas1x1 = ref<HTMLCanvasElement>()
const canvas4x3 = ref<HTMLCanvasElement>()
const canvas16x9 = ref<HTMLCanvasElement>()

const imageWidth = (count: number) => {
  if (count === 1) return '100%'
  else if (count === 2 || count === 4) return '50%'
  else return '33.3%'
}

const imageHeightNumber = (count: number) => {
  const baseHeight = contentWidth.value

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
    _images.posterPath = posterPath
    timelinePrompt.value = _prompt
    timelinePosterPath.value = posterPath as string
    imageGenerating.value = false
  }).catch((e) => {
    imageGenerating.value = false
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(`Failed generate poster: ${JSON.stringify(e)}`)
  })
}

const lruPromptCache = (_prompt: string) => {
  prepareShareData(_prompt)
}

const cacheImageUrl = (_prompt: string, _image: string) => {
  const _images = images.value.get(_prompt) as PromptImage

  _images.images.push({
    imageUrl: _image
  })
  images.value.set(_prompt, _images)

  if (_images.images.length >= imageNumber.value) {
    lruPromptCache(_prompt)
  }
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

  if (imageNumber.value > 9) imageNumber.value = 9
  if (imageNumber.value <= 0) imageNumber.value = 1

  if (letterNumber.value > 200) imageNumber.value = 200
  if (letterNumber.value < 20) imageNumber.value = 20

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

watch(configuring, async () => {
  if (!configuring.value) return

  await nextTick()

  const el = menuPanel.value?.$el as HTMLElement
  el?.focus()
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

const onMenuEnter = async () => {
  await onConfirmConfigureClick()
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

const onPromptStyleClick = (_prompt: string) => {
  promptStyle.value = _prompt
}

onMounted(() => {
  setting.Setting.setCurrentMenu('post')

  model.Model.getModels(() => {
    void refineText(prompt.value)
  })
})

const posterImageWidth = (count: number) => {
  const baseWidth = 900
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

const loadImage = async (image: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = image
  })
}

const sharePoster = async (title: string): Promise<string | undefined> => {
  const _images = images.value.get(title) || {} as PromptImage
  if (!_images || !_images.images || !_images.images.length) return undefined

  const canvas = _images.ratio === '1:1' ? canvas1x1.value : _images.ratio === '4:3' ? canvas4x3.value : canvas16x9.value
  const canvasCtx = canvas?.getContext('2d')
  if (!canvasCtx) return Promise.reject('Invalid context')

  if (_images.total === 1) return Promise.resolve(_images.images[0].imageUrl)

  const _imagesPerRow = imagesPerRow(_images.total)
  const _imageWidth = posterImageWidth(_images.total)
  const _imageHeight = posterImageHeight(_images.total, _images.ratio)

  for (let i = 0; i < _images.images.length; i++) {
    const img = await loadImage(_images.images[i].imageUrl)
    canvasCtx.drawImage(img, _imageWidth * (i % _imagesPerRow), _imageHeight * Math.floor(i / _imagesPerRow), _imageWidth, _imageHeight)
  }

  return Promise.resolve(canvas?.toDataURL('image/png'))
}

const onPreviewImageClick = (image: string, _images: string[]) => {
  previewingImage.value = true
  previewImageIndex.value = _images.indexOf(image)
  previewImages.value = _images
}

const onContentBoxResize = (size: { width: number }) => {
  contentWidth.value = size.width
}

const onChatBoxResize = (size: { height: number }) => {
  chatBox.value?.setScrollPosition('vertical', size.height, 300)
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
