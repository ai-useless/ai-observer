import { nianjingWorker, speakWorker } from 'src/worker'
import { dbBridge } from '..'

export class ENianJing {
  private stopped = false

  speak = async (
    simulatorId: number,
    texts: string[],
    index: number,
    steps: number,
    onMessage: (
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

    const _simulator = await dbBridge._Simulator.simulator(simulatorId)

    speakWorker.SpeakRunner.handleSpeakRequest({
      simulatorId,
      text,
      instruct: `用${_simulator.language || "中文"}说`
    })
      .then((payload1) => {
        if (this.stopped) return
        
        if (!payload1 || !payload1.audio || !payload1.audio.length) {
          this.speak(simulatorId, texts, index + steps, steps, onMessage)
          onMessage(
            text,
            index,
            index === 0,
            index === texts.length - 1,
            undefined
          )
          return
        }
        this.speak(simulatorId, texts, index + steps, steps, onMessage)
        onMessage(
          text,
          index,
          index === 0,
          index === texts.length - 1,
          payload1.audio
        )
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed speak: ${e}`)
        onMessage(
          text,
          index,
          index === 0,
          index === texts.length - 1,
          undefined
        )
      })
  }

  request = (
    name: string,
    simulatorId: number,
    modelId: number,
    onMessage: (
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
          this.speak(simulatorId, payload.texts, i, steps, onMessage)
        }
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed generate: ${e}`)
      })
  }

  stop = () => {
    this.stopped = true
  }
}
