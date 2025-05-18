import { nianjingWorker, speakWorker } from 'src/worker'

export class ENianJing {
  static speak = (simulatorId: number, texts: string[], index: number, steps: number, onMessage: (message: string, index: number, audio?: string) => void) => {
    if (index >= texts.length) return

    const text = texts[index]

    speakWorker.SpeakRunner.handleSpeakRequest({
      simulatorId,
      text
    }).then((payload1) => {
      if (!payload1 || !payload1.audio || !payload1.audio.length) {
        ENianJing.speak(simulatorId, texts, index + steps, steps, onMessage)
        onMessage(text, index, undefined)
        return
      }
      ENianJing.speak(simulatorId, texts, index + steps, steps, onMessage)
      onMessage(text, index, payload1.audio)
    })
  }

  static request = (
    name: string,
    simulatorId: number,
    modelId: number,
    onMessage: (message: string, index: number, audio?: string) => void
  ) => {
    nianjingWorker.NianJingRunner.handleGenerateRequest({
      name,
      modelId
    })
      .then((payload) => {
        if (!payload || !payload.texts || !payload.texts.length) {
          return
        }
        const steps = 5
        for (let i = 0; i < steps; i++) {
          ENianJing.speak(simulatorId, payload.texts, i, steps, onMessage)
        }
      })
      .catch((e) => {
        console.log(`Failed generate: ${e}`)
      })
  }
}
