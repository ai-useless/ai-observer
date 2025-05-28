import {
  duanziWorker,
  imageWorker,
  refineWorker,
  speakWorker
} from 'src/worker'
import { _Model } from '../db'
import { dbBridge } from '..'

export class Duanzi {
  private static baseTextIndex = 0
  private stopped = false

  refineImagePrompt = async (
    text: string,
    baseIndex: number,
    index: number,
    onImage: (index: number, image: string) => void
  ) => {
    if (this.stopped) return

    refineWorker.RefineRunner.handleGenerateRequest({
      intent: refineWorker.Intent.REFINE_PROMPT,
      style: '内涵无厘头搞笑',
      prompt: text,
      letters: 0,
      modelId: await _Model.topicModelId()
    })
      .then((payload) => {
        if (!payload || !payload.text || !payload.text.length) return
        if (this.stopped) return

        imageWorker.ImageRunner.handleGenerateRequest({
          prompt: payload.text,
          style: '内涵无厘头搞笑漫画',
          dialog: false,
          extra:
            '图片中的搞笑人物头像可以使用不同的搞笑表情包头像。不允许出现真人头像。',
          highResolution: false,
          ratio: '16:9'
        })
          .then((_payload) => {
            if (_payload && _payload.image)
              onImage(baseIndex + index, _payload.image)
          })
          .catch((e) => {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            console.log(`Failed generate image: ${e}`)
          })
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed refine: ${e}`)
      })
  }

  generateMedia = async (
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
    if (this.stopped) return

    let text = texts[index]
    text = text.replace('*', '').replace('#', '').replace(' ', '')
    const isTitle = text.startsWith('标题')

    text = text.replace('标题：', '').replace('内容：', '')

    if (!isTitle && generateImage) {
      await this.refineImagePrompt(text, baseIndex, index, onImage)
    }

    const _simulator = await dbBridge._Simulator.simulator(simulatorId)

    speakWorker.SpeakRunner.handleSpeakRequest({
      text,
      simulatorId,
      instruct: `用${_simulator.language || "中文"}说`
    })
      .then((payload) => {
        if (!payload) {
          onMessage(text, isTitle, baseIndex + index, undefined)
          void this.generateMedia(
            texts,
            simulatorId,
            baseIndex,
            index + steps,
            steps,
            generateAudio,
            true,
            onMessage,
            onImage
          )
          return
        }
        onMessage(text, isTitle, baseIndex + index, payload.audio)
        void this.generateMedia(
          texts,
          simulatorId,
          baseIndex,
          index + steps,
          steps,
          generateAudio,
          true,
          onMessage,
          onImage
        )
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed generate audio: ${e}`)
        onMessage(text, isTitle, baseIndex + index, undefined)
        void this.generateMedia(
          texts,
          simulatorId,
          baseIndex,
          index + steps,
          steps,
          generateAudio,
          true,
          onMessage,
          onImage
        )
      })
  }

  generate = async (
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
    if (this.stopped) return

    try {
      const payload = await duanziWorker.DuanziRunner.handleGenerateRequest({
        historyMessages,
        modelId
      })
      if (!payload) return

      if (this.stopped) return

      const steps = 5
      for (let i = 0; i < 5; i++) {
        if (this.stopped) return

        void this.generateMedia(
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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Failed generate: ${e}`)
    }
  }

  stop = () => {
    this.stopped = true
  }
}
