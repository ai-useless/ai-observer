import { duanziWorker, speakWorker } from 'src/worker'

export class Duanzi {
  private static baseTextIndex = 0

  static generateAudio = (texts: string[], simulatorId: number, index: number, steps: number, onMessage: (text: string, isTitle: boolean, index: number, audio?: string) => void) => {
    if (index === texts.length) Duanzi.baseTextIndex += texts.length
    if (index >= texts.length) return

    let text = texts[index]
    text = text.replace('*', '').replace('#', '').replace(' ', '')
    const isTitle = text.startsWith('标题')

    text = text.replace('标题：', '').replace('内容：', '')

    speakWorker.SpeakRunner.handleSpeakRequest({
      text,
      simulatorId
    }).then((payload) => {
      if (!payload) {
        onMessage(text, isTitle, Duanzi.baseTextIndex + index, undefined)
        Duanzi.generateAudio(texts, simulatorId, index + steps, steps, onMessage)
        return
      }
      onMessage(text, isTitle, Duanzi.baseTextIndex + index, payload.audio)
      Duanzi.generateAudio(texts, simulatorId, index + steps, steps, onMessage)
    }).catch((e) => {
      console.log(`Failed generate audio: ${e}`)
      onMessage(text, isTitle, Duanzi.baseTextIndex + index, undefined)
      Duanzi.generateAudio(texts, simulatorId, index + steps, steps, onMessage)
    })
  }

  static generate = (
    historyMessages: string[],
    modelId: number,
    simulatorId: number,
    onMessage: (text: string, isTitle: boolean, index: number, audio?: string) => void,
    generateAudio?: boolean
  ) => {
    duanziWorker.DuanziRunner.handleGenerateRequest({
      historyMessages,
      modelId
    })
      .then(async (payload) => {
        if (!payload) {
          return
        }

        if (generateAudio === false) {
          for (let i = 0; i < payload.texts.length; i++) {
            const text = payload.texts[i]
            onMessage(text, text.startsWith('标题'), Duanzi.baseTextIndex + i, undefined)
            Duanzi.baseTextIndex += payload.texts.length
          }
          return
        }

        const steps = 5
        for (let i = 0; i < 5; i++) {
          Duanzi.generateAudio(payload.texts, simulatorId, i, steps, onMessage)
        }
      })
      .catch((e) => {
        console.log(`Failed generate: ${e}`)
      })
  }
}
