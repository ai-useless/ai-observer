import { nianjingWorker, singWorker, speakWorker } from 'src/worker'
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
      text: text.replace(/^\[\d+:\d+:\d+\]/, ''),
      instruct: `用${_simulator.language || "中文"}说，念诵佛经风格`
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

  sing = (simulatorId: number, name: string, text: string, onMusic: (name: string, music: string, letters: number) => void) => {
    singWorker.SingRunner.handleSingRequest({
      simulatorId,
      lrcText: text,
      // refPrompt: '梵呗唱诵，佛经风格，无背景音，男声清唱，人声清晰，慢速节奏60BPM，禅意和声，敲木鱼'
      // refPrompt: '佛教诵经, 梵呗, 冥想音乐, 缓慢节奏, 单音吟诵, 宁静祥和, 60 BPM'
      refPrompt: 'chanting, buddhist, sutra, meditative, slow tempo, monotone, drone, spiritual, ceremonial, a cappella'
    }).then((payload) => {
      if (!payload || !payload.audio) {
        return
      }
      onMusic(name, payload.audio, text.length)
    }).catch((e) => {
      console.log(`Failed sing: ${e}`)
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
    ) => void,
    onMusic: (name: string, music: string, letters: number) => void
  ) => {
    if (this.stopped) return

    nianjingWorker.NianJingRunner.handleGenerateRequest({
      name,
      modelId
    })
      .then((payload) => {
        if (!payload || !payload.texts || !payload.texts.length) {
          setTimeout(() => {
            this.request(name, simulatorId, modelId, onMessage, onMusic)
          }, 1000)
          return
        }

        if (this.stopped) return

        const steps = 5
        for (let i = 0; i < steps; i++) {
          this.speak(simulatorId, payload.texts, i, steps, onMessage)
        }
        this.sing(simulatorId, name, payload.text, onMusic)
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
