<template>
  <View>
    <scroll-view
      scrollY={true}
      :scroll-with-animation='true'
      :style='{ height: postHeight + "px" }'
      :scroll-top='scrollTop'
      showScrollbar={false}
      enhanced={true}
      showsVerticalScrollIndicator={false}
    >
      <View v-for='([_prompt, _images], index) in images' :key='index' :style='{borderBottom: "1px solid lightgray", padding: "8px 0", width: "100%"}'>
        <View :style='{width: "100%", height: imageHeight(_images.total, _images.ratio)}'>
          <View v-if='_images.images.length' style='width: 100%; display: flex;'>
            <View
              v-for='(image, index) in _images.images.slice(0, imagesPerRow(_images.total))'
              :key='index'
              @click='onPreviewImageClick(image.imageUrl, [..._images.images.map((el) => el.imageUrl), ...(_images.posterPath ? [_images.posterPath] : [])])'
              :style='{width: imageWidth(_images.total), height: imageHeight(_images.total, _images.ratio)}'
            >
              <Image
                :src='image.imageUrl'
                mode='widthFix'
                :style='{width: "100%", height: imageHeight(_images.total, _images.ratio)}'
              />
            </View>
          </View>
          <View v-if='_images.images.length > imagesPerRow(_images.total)' style='width: 100%; display: flex;'>
            <View
              v-for='(image, index) in _images.images.slice(imagesPerRow(_images.total), imagesPerRow(_images.total) * 2)'
              :key='index'
              @click='onPreviewImageClick(image.imageUrl, [..._images.images.map((el) => el.imageUrl), ...(_images.posterPath ? [_images.posterPath] : [])])'
              :style='{width: imageWidth(_images.total), height: imageHeight(_images.total, _images.ratio)}'
            >
              <Image
                :src='image.imageUrl'
                mode='widthFix'
                :style='{width: "100%", height: imageHeight(_images.total, _images.ratio)}'
              />
            </View>
          </View>
          <View v-if='_images.images.length > imagesPerRow(_images.total) * 2' style='width: 100%; display: flex;'>
            <View
              v-for='(image, index) in _images.images.slice(imagesPerRow(_images.total) * 2)'
              :key='index'
              @click='onPreviewImageClick(image.imageUrl, [..._images.images.map((el) => el.imageUrl), ...(_images.posterPath ? [_images.posterPath] : [])])'
              :style='{width: imageWidth(_images.total), height: imageHeight(_images.total, _images.ratio)}'
            >
              <Image
                :src='image.imageUrl'
                mode='widthFix'
                :style='{width: "100%", height: imageHeight(_images.total, _images.ratio)}'
              />
            </View>
          </View>
        </View>
        <View style='margin-top: 8px; font-size: 12px; color: gray;'>{{ _prompt }}</View>
        <View style='display: flex; margin-top: 4px; flex-direction: row-reverse;'>
          <View>
            <Button class='plain-btn' size='mini' plain open-type='share' style='width: 24px; height: 24px;' :data-id='index' :data-title='_prompt' :disabled='_images.successes < _images.total'>
              <Image :src='share' style='width: 16px; height: 16px;' />
            </Button>
          </View>
          <View>
            <Button v-if='_images.responds < _images.total' class='plain-btn' size='mini' plain style='margin-left: 4px; font-size: 12px; color: gray; height: 24px; margin-right: 4px;' :loading='true'>
              {{ _images.total - _images.responds }}张美图生成中...
            </Button>
          </View>
          <View v-if='_images.errors > 0' style='display: flex; margin-right: 4px; height: 26px; justify-content: center; align-items: center;'>
            <Image :src='fail' style='width: 16px; height: 16px;' />
            <Text style='font-size: 12px; color: gray; margin-left: 4px;'>{{ _images.errors }}失败</Text>
          </View>
          <View v-if='_images.successes > 0' style='display: flex; margin-right: 4px; height: 26px; justify-content: center; align-items: center;'>
            <Image :src='check' style='width: 16px; height: 16px;' />
            <Text style='font-size: 12px; color: gray; margin-left: 4px;'>{{ _images.successes }}成功</Text>
          </View>
        </View>
      </View>
    </scroll-view>
    <View style='display: flex;'>
      <ComplexInput v-model:prompt='prompt' v-model:audio-input='audioInput' v-model:height='inputHeight' placeholder='随便问点儿啥'>
        <template #actions>
          <View style='height: 24px; width: 24px; padding: 3px 0; margin-left: 4px; margin-right: -4px;' @click='onGenerateClick'>
            <Image :src='send' style='width: 18px; height: 18px;' />
          </View>
        </template>
      </ComplexInput>
    </View>
    <Canvas canvasId='canvas' style='width: 900px; height: 900px; position: fixed; left: 100000px; z-index: -1000; opacity: 0;' />
  </View>
  <AtModal :is-opened='configuring' @close='onConfigureClose'>
    <AtModalHeader>创作设置</AtModalHeader>
    <AtModalContent>
      <View>
        <View style='display: flex; line-height: 18px;'>
          <View style='width: 60%; display: flex;'>
            <View style='font-size: 14px; color: gray;'>图片数</View>
            <View style='font-size: 12px; color: gray;'>(最多9张)</View>
          </View>
          <View style='width: 40%; display: flex; flex-direction: row-reverse;'>
            <Input :value='imageNumber' type='number' style='text-align: right; border: 1px solid lightgray; padding: 0 4px; border-radius: 4px;' @input='onImageNumberInput' />
          </View>
        </View>
        <View style='display: flex; line-height: 18px; margin-top: 4px;'>
          <View style='width: 60%; display: flex;'>
            <View style='font-size: 14px; color: gray;'>宽高比</View>
          </View>
          <View style='width: 40%; display: flex; flex-direction: row-reverse;'>
            <View :style='{fontSize: "12px", backgroundColor: imageRatio === "1:1" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageRatioChange("1:1")'>1:1</View>
            <View :style='{fontSize: "12px", backgroundColor: imageRatio === "4:3" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageRatioChange("4:3")'>4:3</View>
            <View :style='{fontSize: "12px", backgroundColor: imageRatio === "16:9" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageRatioChange("16:9")'>16:9</View>
          </View>
        </View>
        <View style='display: flex; line-height: 18px; margin-top: 4px;'>
          <View style='width: 60%; display: flex;'>
            <View style='font-size: 14px; color: gray;'>清晰度</View>
          </View>
          <View style='width: 40%; display: flex; flex-direction: row-reverse;'>
            <View :style='{fontSize: "12px", backgroundColor: imageResolution === "标清" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageResolutionChange("标清")'>标清</View>
            <View :style='{fontSize: "12px", backgroundColor: imageResolution === "高清" ? "lightblue" : "white", marginLeft: "4px", borderRadius: "4px", border: "1px solid lightblue", padding: "0 4px"}' @click='onImageResolutionChange("高清")'>高清</View>
          </View>
        </View>
        <View style='display: flex; line-height: 18px; margin-top: 4px;'>
          <View style='width: 20%; display: flex;'>
            <View style='font-size: 14px; color: gray;'>风格</View>
          </View>
          <View style='width: 80%;'>
            <View style='display: flex; flex-wrap: wrap;'>
              <View v-for='(style, index) in styles' :key='index' @click='onStyleClick(style)'>
                <Text style='font-size: 12px; color: blue; margin-left: 4px;'>{{ style }}</Text>
              </View>
            </View>
            <View style='margin-top: 4px; display: flex; flex-direction: row;'>
              <Input :value='imageStyle' placeholder='任何你喜欢的风格' style='border: 1px solid lightgray; margin-left: 4px; border-radius: 4px; padding: 0 4px;' @input='onImageStyleInput' />
              <View style='font-size: 12px; color: blue; margin-left: 4px;' @click='onStyleClick(imageStyle)'>确定</View>
            </View>
            <View style='margin-top: 4px;' />
            <View style='display: flex; flex-wrap: wrap;'>
              <View v-for='(style, index) in imageStyles' :key='index' style='margin-left: 4px; border-radius: 4px; border: 1px solid lightblue; margin-top: 4px;' @click='onSelectedStyleClick(style)'>
                <Text style='font-size: 12px; color: gray; padding: 0 4px;'>{{ style }}</Text>
                <Text style='font-size: 10px; color: gray; margin-right: 4px;'>| 删除</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </AtModalContent>
    <AtModalAction>
      <Button @click='onConfirmConfigureClick'>确定</Button>
      <Button @click='onCancelConfigureClick'>取消</Button>
    </AtModalAction>
  </AtModal>
</template>

<script setup lang='ts'>
import { View, Image, Button, Canvas, Text, Input } from '@tarojs/components'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { dbBridge, entityBridge } from 'src/bridge'
import Taro, { ShareAppMessageObject, ShareAppMessageReturn, ShareTimelineReturnObject, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { AtModal, AtModalHeader, AtModalContent, AtModalAction } from 'taro-ui-vue3'
import { model } from 'src/localstores'

import ComplexInput from '../input/ComplexInput.vue'

import { send, share, check, fail } from 'src/assets'

const prompt = ref('忐忑又充满希望')

const timelinePrompt = ref(prompt.value)
const timelinePosterPath = ref(undefined as unknown as string)

const audioInput = ref(false)
const audioError = ref('')

const inputHeight = ref(0)
const postHeight = ref(0)
const scrollTop = ref(999999)
const generating = ref(false)

const configuring = ref(false)
const imageNumber = ref(1)
const imageRatio = ref('1:1')
const imageResolution = ref('标清')

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
const imageStyles = ref([] as string[])
const imageStyle = ref('')

interface ImageData {
  imageUrl: string
  imagePath: string
}
interface PromptImage {
  total: number
  ratio: string
  responds: number
  successes: number
  errors: number
  posterPath?: string
  images: ImageData[]
}
const images = ref(new Map<string, PromptImage>())
const imageCount = computed(() => images.value.size)

watch(imageCount, async () => {
  await nextTick()
  scrollTop.value += 1
})

const imageWidth = (count: number) => {
  if (count === 1) return '100%'
  else if (count === 2) return '50%'
  else return '33.3%'
}

const imageHeight = (count: number, ratio: string) => {
  let baseHeight = 0
  if (Taro.getWindowInfo()) {
    baseHeight = Taro.getWindowInfo().windowWidth - 32
  }
  if (count === 2 || count === 4) baseHeight = Math.floor(baseHeight / 2)
  else baseHeight = Math.floor(baseHeight / 3)

  if (ratio === '1:1') return `${baseHeight}px`
  else if (ratio === '4:3') return `${Math.floor(baseHeight * 0.75)}px`
  else return `${Math.floor(baseHeight * 9 / 16)}px`
}

const imagesPerRow = (count: number) => {
  if (count <= 3) return count
  else if (count === 4) return 2
  else return 3
}

const prepareShareData = (_prompt: string) => {
  const _images = images.value.get(_prompt) as PromptImage

  sharePoster(_prompt).then((posterPath) => {
    _images.posterPath = posterPath as string
    timelinePrompt.value = _prompt
    timelinePosterPath.value = posterPath as string
  }).catch((e) => {
    console.log(`Failed generate poster: ${e}`)
  })
}

const lruPromptCache = (_prompt: string) => {
  if (cachePrompts.value.length < 20) {
    prepareShareData(_prompt)
    return
  }

  const _images = images.value.get(_prompt) as PromptImage
  _images.images.forEach((el) => {
    const fs = Taro.getFileSystemManager()
    fs.removeSavedFile({
      filePath: el.imagePath
    })
  })

  cachePrompts.value = cachePrompts.value.slice(1)
  prepareShareData(_prompt)
}

const cacheImageUrl = (_prompt: string, _image: string) => {
  const _images = images.value.get(_prompt) as PromptImage
  Taro.getImageInfo({
    src: _image,
    success: (res) => {
      _images.images.push({
        imageUrl: _image,
        imagePath: res.path
      })
      images.value.set(_prompt, _images)
      if (_images.images.length >= imageNumber.value) {
        lruPromptCache(_prompt)
      }
    },
    fail: () => {
      setTimeout(() => {
        cacheImageUrl(_prompt, _image)
      }, 1000)
    }
  })
}

const generate = (_prompt: string, style: string) => {
  const _images = images.value.get(_prompt) as PromptImage

  entityBridge.EImage.generate(_prompt, style, false, '', imageResolution.value === '高清', imageRatio.value, (_image: string) => {
    _images.responds += 1
    _images.successes += 1
    cacheImageUrl(_prompt, _image)
  }, () => {
    _images.responds += 1
    _images.errors += 1
    images.value.set(_prompt, _images)
  })
}

const refine = (_prompt: string) => {
  generating.value = true

  entityBridge.EChat.refine(_prompt, dbBridge._Model.topicModelId()).then((__prompt) => {
    generating.value = false
    if (!__prompt) {
      return
    }
    const _images = images.value.get(__prompt) || {
      total: imageNumber.value,
      ratio: imageRatio.value,
      successes: 0,
      errors: 0,
      responds: 0,
      images: []
    } as PromptImage
    images.value.set(__prompt, _images)
    for (let i = 0; i < imageNumber.value; i++) {
      generate(__prompt, imageStyles.value[i % imageStyles.value.length])
    }
  }).catch((e) => {
    generating.value = false
    console.log(`Failed refine: ${e}`)
  })
}

watch(generating, () => {
  if (generating.value) {
    Taro.showLoading({
      title: '正在创作...'
    })
  } else {
    Taro.hideLoading()
  }
})

watch(prompt, () => {
  if (!audioInput.value || !prompt.value || !prompt.value.length) return

  refine(prompt.value)
})

watch(audioError, () => {
  if (!audioInput.value || !audioError.value || !audioError.value.length) return

  audioError.value = ''
})

watch(inputHeight, () => {
  if (Taro.getWindowInfo()) {
    postHeight.value = Taro.getWindowInfo().windowHeight - 32 - inputHeight.value
  }
})

const onGenerateClick = () => {
  if (generating.value) return
  configuring.value = true
}

const onConfirmConfigureClick = () => {
  configuring.value = false
  refine(prompt.value)
}

const onCancelConfigureClick = () => {
  configuring.value = false
}

const onConfigureClose = () => {
  configuring.value = false
}

const onStyleClick = (style: string) => {
  if (imageStyles.value.includes(style)) return
  if (imageStyles.value.length >= imageNumber.value) return
  imageStyles.value.push(style)
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
  imageNumber.value = Number(e.detail.value)
}

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

onMounted(async () => {
  Taro.setNavigationBarTitle({
    title: 'AGI超有才'
  })

  if (Taro.getWindowInfo()) {
    postHeight.value = Taro.getWindowInfo().windowHeight - 32
  }
  model.Model.getModels()
})

const sharePoster = async (title: string) => {
  const canvasId = 'canvas'
  const canvasCtx = Taro.createCanvasContext(canvasId)

  const _images = images.value.get(title) || {} as PromptImage
  if (!_images || !_images.images || !_images.images.length) return undefined

  if (_images.total === 1) return _images.images[0].imagePath

  const _imagesPerRow = imagesPerRow(_images.total)

  for (let i = 0; i < _images.images.length; i++) {
    canvasCtx.drawImage(_images.images[i].imagePath, posterImageWidth(_images.total) * (i % _imagesPerRow), posterImageHeight(_images.total, _images.ratio) * Math.floor(i / _imagesPerRow), 300, 300)
  }

  return new Promise((resolve, reject) => {
    canvasCtx.draw(false, () => {
      Taro.canvasToTempFilePath({
        canvasId,
        success: res => resolve(res.tempFilePath),
        fail: e => reject(e)
      })
    })
  })
}

useShareAppMessage((res: ShareAppMessageObject) => {
  let posterPath = timelinePosterPath.value
  let dataTitle = timelinePrompt.value

  if (res.from === 'button') {
    const dataset = res.target ? (res.target as Record<string, Record<string, string>>).dataset || {} : {}
    dataTitle = dataset.title
    posterPath = images.value[dataTitle].posterPath || timelinePosterPath.value
  }

  console.log(dataTitle, posterPath, 111)

  return {
    title: dataTitle,
    path: '/pages/post/PostPage',
    imageUrl: posterPath
  } as ShareAppMessageReturn
})

useShareTimeline(() => {
  return {
    title: timelinePrompt.value,
    imageUrl: timelinePosterPath.value
  } as ShareTimelineReturnObject
})

const onPreviewImageClick = (image: string, _images: string[]) => {
  Taro.previewImage({
    current: image,
    urls: _images,
    enablesavephoto: true,
    enableShowPhotoDownload: true,
    showmenu: true
  })
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
