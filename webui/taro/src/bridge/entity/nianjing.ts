import { nianjingWorker, speakWorker } from 'src/worker'
import { dbBridge } from '..'

export class ENianJing {
  static speak = (
    name: string,
    simulatorId: number,
    texts: string[],
    index: number,
    steps: number,
    onMessage: (
      topic: string,
      message: string,
      index: number,
      first: boolean,
      last: boolean,
      audio?: string
    ) => void
  ) => {
    if (index >= texts.length) return

    const text = texts[index]

    const _simulator = dbBridge._Simulator.simulator(simulatorId)
    const instruct = _simulator ? `用${_simulator.language}说` : '用中文说'

    speakWorker.SpeakRunner.handleSpeakRequest({
      simulatorId,
      text,
      instruct
    }).then((payload1) => {
      if (!payload1 || !payload1.audio || !payload1.audio.length) {
        ENianJing.speak(name, simulatorId, texts, index + steps, steps, onMessage)
        onMessage(
          name,
          text,
          index,
          index === 0,
          index === texts.length - 1,
          undefined
        )
        return
      }
      ENianJing.speak(name, simulatorId, texts, index + steps, steps, onMessage)
      onMessage(
        name,
        text,
        index,
        index === 0,
        index === texts.length - 1,
        payload1.audio
      )
    })
  }

  static request = (
    name: string,
    simulatorId: number,
    modelId: number,
    onMessage: (
      name: string,
      message: string,
      index: number,
      first: boolean,
      last: boolean,
      audio?: string
    ) => void
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
          ENianJing.speak(name, simulatorId, payload.texts, i, steps, onMessage)
        }
      })
      .catch((e) => {
        console.log(`Failed generate: ${e}`)
      })
  }
}
