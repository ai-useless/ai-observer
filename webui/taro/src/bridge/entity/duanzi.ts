import { duanziWorker, imageWorker, speakWorker } from 'src/worker'

export class Duanzi {
  private static baseTextIndex = 0

  static generateAudio = (
    texts: string[],
    simulatorId: number,
    baseIndex: number,
    index: number,
    steps: number,
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

    if (!isTitle) {
      imageWorker.ImageRunner.handleGenerateRequest({
        prompt: text,
        style: '内涵无厘头搞笑漫画',
        dialog: false,
        extra: '图片中的搞笑人物头像可以使用不同的搞笑表情包头像。',
        highResolution: false,
        ratio: '16:9'
      })
        .then((payload) => {
          if (payload && payload.image)
            onImage(baseIndex + index, payload.image)
        })
        .catch((e) => {
          console.log(`Failed generate image: ${e}`)
        })
    }

    speakWorker.SpeakRunner.handleSpeakRequest({
      text,
      simulatorId
    })
      .then((payload) => {
        if (!payload) {
          onMessage(text, isTitle, baseIndex + index, undefined)
          Duanzi.generateAudio(
            texts,
            simulatorId,
            baseIndex,
            index + steps,
            steps,
            onMessage,
            onImage
          )
          return
        }
        onMessage(text, isTitle, baseIndex + index, payload.audio)
        Duanzi.generateAudio(
          texts,
          simulatorId,
          baseIndex,
          index + steps,
          steps,
          onMessage,
          onImage
        )
      })
      .catch((e) => {
        console.log(`Failed generate audio: ${e}`)
        onMessage(text, isTitle, baseIndex + index, undefined)
        Duanzi.generateAudio(
          texts,
          simulatorId,
          baseIndex,
          index + steps,
          steps,
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

      if (generateAudio === false) {
        for (let i = 0; i < payload.texts.length; i++) {
          const text = payload.texts[i]
            .replace('*', '')
            .replace('#', '')
            .replace(' ', '')
          onMessage(
            text,
            text.startsWith('标题'),
            Duanzi.baseTextIndex + i,
            undefined
          )
          Duanzi.baseTextIndex += payload.texts.length
        }
        return
      }

      const steps = 5
      for (let i = 0; i < 5; i++) {
        Duanzi.generateAudio(
          payload.texts,
          simulatorId,
          Duanzi.baseTextIndex,
          i,
          steps,
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
