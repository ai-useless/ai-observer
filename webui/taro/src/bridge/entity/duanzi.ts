import { duanziWorker, imageWorker, refineWorker, speakWorker } from 'src/worker'
import { _Model } from '../db'

export class Duanzi {
  private static baseTextIndex = 0

  static refineImagePrompt = async (text: string, baseIndex: number, index: number, onImage: (index: number, image: string) => void) => {
    refineWorker.RefineRunner.handleGenerateRequest({
      intent: refineWorker.Intent.REFINE_PROMPT,
      prompt: text,
      modelId: _Model.topicModelId()
    }).then((payload) => {
      if (!payload || !payload.text || !payload.text.length) return

      imageWorker.ImageRunner.handleGenerateRequest({
        prompt: payload.text,
        style: '内涵无厘头搞笑漫画',
        dialog: false,
        extra: '图片中的搞笑人物头像可以使用不同的搞笑表情包头像。不允许出现真人头像。',
        highResolution: false,
        ratio: '16:9'
      })
        .then((_payload) => {
          if (_payload && _payload.image)
            onImage(baseIndex + index, _payload.image)
        })
        .catch((e) => {
          console.log(`Failed generate image: ${e}`)
        })
    }).catch((e) => {
      console.log(`Failed refine: ${e}`)
    })
  }

  static generateMedia = (
    texts: string[],
    simulatorId: number,
    baseIndex: number,
    index: number,
    steps: number,
    generateAudio: boolean,
    generateImage: boolean,
    onMessage: (
      text: string,
      isTitle: boolean,
      index: number,
      audio?: string
    ) => void,
    onImage: (index: number, image: string) => void
  ) => {
    if (index >= texts.length) return

    let text = texts[index]
    text = text.replace('*', '').replace('#', '').replace(' ', '')
    const isTitle = text.startsWith('标题')

    text = text.replace('标题：', '').replace('内容：', '')

    if (!isTitle && generateImage) {
      Duanzi.refineImagePrompt(text, baseIndex, index, onImage)
    }

    speakWorker.SpeakRunner.handleSpeakRequest({
      text,
      simulatorId
    })
      .then((payload) => {
        if (!payload) {
          onMessage(text, isTitle, baseIndex + index, undefined)
          Duanzi.generateMedia(
            texts,
            simulatorId,
            baseIndex,
            index + steps,
            steps,
            generateAudio,
            false,
            onMessage,
            onImage
          )
          return
        }
        onMessage(text, isTitle, baseIndex + index, payload.audio)
        Duanzi.generateMedia(
          texts,
          simulatorId,
          baseIndex,
          index + steps,
          steps,
          generateAudio,
          false,
          onMessage,
          onImage
        )
      })
      .catch((e) => {
        console.log(`Failed generate audio: ${e}`)
        onMessage(text, isTitle, baseIndex + index, undefined)
        Duanzi.generateMedia(
          texts,
          simulatorId,
          baseIndex,
          index + steps,
          steps,
          generateAudio,
          false,
          onMessage,
          onImage
        )
      })
  }

  static generate = async (
    historyMessages: string[],
    modelId: number,
    simulatorId: number,
    onMessage: (
      text: string,
      isTitle: boolean,
      index: number,
      audio?: string
    ) => void,
    onImage: (index: number, image: string) => void,
    generateAudio?: boolean
  ) => {
    try {
      const payload = await duanziWorker.DuanziRunner.handleGenerateRequest({
        historyMessages,
        modelId
      })
      if (!payload) return

      const steps = 5
      for (let i = 0; i < 5; i++) {
        Duanzi.generateMedia(
          payload.texts,
          simulatorId,
          Duanzi.baseTextIndex,
          i,
          steps,
          generateAudio === undefined ? true : generateAudio,
          true,
          onMessage,
          onImage
        )
      }
      Duanzi.baseTextIndex += payload.texts.length
    } catch (e) {
      console.log(`Failed generate: ${e}`)
    }
  }
}
