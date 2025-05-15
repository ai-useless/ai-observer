import { duanziWorker, speakWorker } from 'src/worker'

export class Duanzi {
  private static textIndex = -1

  static generateAudio = (text: string, simulatorId: number, index: number, onMessage: (text: string, isTitle: boolean, index: number, audio?: string) => void) => {
    text = text.replace('*', '').replace('#', '').replace(' ', '')
    const isTitle = text.startsWith('标题')

    text = text.replace('标题：', '').replace('内容：', '')

    speakWorker.SpeakRunner.handleSpeakRequest({
      text,
      simulatorId
    }).then((payload) => {
      if (!payload) {
        onMessage(text, isTitle, index, undefined)
        return
      }
      onMessage(text, isTitle, index, payload.audio)
    }).catch((e) => {
      console.log(`Failed generate audio: ${e}`)
      onMessage(text, isTitle, index, undefined)
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
      .then((payload) => {
        if (!payload) {
          return
        }
        for (const text of payload.texts) {
          Duanzi.textIndex += 1
          if (generateAudio === undefined || generateAudio) {
            Duanzi.generateAudio(text, simulatorId, Duanzi.textIndex, onMessage)
          } else {
            onMessage(text, text.startsWith('标题'), Duanzi.textIndex, undefined)
          }
        }
      })
      .catch((e) => {
        console.log(`Failed generate: ${e}`)
      })
  }
}
