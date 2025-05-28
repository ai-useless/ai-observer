import { nianjingWorker, speakWorker } from 'src/worker'
import { dbBridge } from '..'

export class ENianJing {
  private stopped = false

  speak = (
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
    if (this.stopped) return

    const text = texts[index]

    const _simulator = dbBridge._Simulator.simulator(simulatorId)
    const instruct = _simulator ? `用${_simulator.language}说` : '用中文说'

    speakWorker.SpeakRunner.handleSpeakRequest({
      simulatorId,
      text,
      instruct
    }).then((payload1) => {
      if (this.stopped) return

      if (!payload1 || !payload1.audio || !payload1.audio.length) {
        this.speak(name, simulatorId, texts, index + steps, steps, onMessage)
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
      this.speak(name, simulatorId, texts, index + steps, steps, onMessage)
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

  request = (
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
    if (this.stopped) return

    nianjingWorker.NianJingRunner.handleGenerateRequest({
      name,
      modelId
    })
      .then((payload) => {
        if (!payload || !payload.texts || !payload.texts.length) {
          setTimeout(() => {
            this.request(name, simulatorId, modelId, onMessage)
          }, 1000)
          return
        }

        if (this.stopped) return

        const steps = 5
        for (let i = 0; i < steps; i++) {
          this.speak(name, simulatorId, payload.texts, i, steps, onMessage)
        }
      })
      .catch((e) => {
        console.log(`Failed generate: ${e}`)
      })
  }

  stop = () => {
    this.stopped = true
  }
}
