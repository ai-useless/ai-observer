import { chatWorker, refineWorker, speakWorker } from 'src/worker'
import { dbBridge } from '..'

export class EChat {
  private curTextIndex = 0
  private stopped = false

  speak = async (
    texts: string[],
    simulatorId: number,
    baseIndex: number,
    index: number,
    steps: number,
    instruct: string,
    onMessage: (message?: string, audio?: string, error?: string, index?: number) => void
  ) => {
    if (index >= texts.length) return
    if (this.stopped) return

    const text = texts[index]

    speakWorker.SpeakRunner.handleSpeakRequest({
      simulatorId,
      text,
      instruct
    })
      .then((payload1) => {
        void this.speak(texts, simulatorId, baseIndex, index + steps, steps, instruct, onMessage)

        if (!payload1 || !payload1.audio || !payload1.audio.length) {
          onMessage(text, undefined, undefined, baseIndex + index)
          return
        }
        onMessage(text, payload1.audio, undefined, baseIndex + index)
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed speak: ${e}`)
        onMessage(text, undefined, undefined, baseIndex + index)
        void this.speak(texts, simulatorId, baseIndex, index + steps, steps, instruct, onMessage)
      })
  }

  chat = async (
    simulatorId: number,
    personality: string,
    myName: string,
    messages: string[],
    modelId: number,
    language: string,
    noInstruct: boolean,
    onMessage: (message?: string, audio?: string, error?: string, index?: number) => void
  ) => {
    const _simulator = await dbBridge._Simulator.simulator(simulatorId)
    if (!_simulator) return

    chatWorker.ChatRunner.handleGenerateRequest({
      simulator: _simulator.simulator,
      personality,
      myName,
      language,
      historyMessages: messages,
      modelId
    })
      .then(async (payload) => {
        const baseIndex = this.curTextIndex
        this.curTextIndex += payload ? payload.texts.length : 1

        if (!payload || !payload.text || !payload.text.length) {
          onMessage(
            undefined,
            undefined,
            '你的伙伴好像什么也没有发送给你！这是传说中的空包吗？',
            baseIndex
          )
          return
        }

        let instruct = ''
        if (noInstruct && language === '英语') {
          instruct = `用${language}说`
        }
        if (!noInstruct && _simulator) {
          instruct = `用${_simulator.language}说`
        }

        const steps = 5
        for (let i = 0; i < steps; i++) {
          void this.speak(payload.texts, simulatorId, baseIndex, i, steps, instruct, onMessage)
        }
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed generate: ${e}`)
        onMessage(undefined, undefined, '出错啦！再试试吧！', this.curTextIndex++)
      })
  }

  static refineText = async (
    prompt: string,
    style: string,
    letters: number,
    modelId: number
  ) => {
    const payload = await refineWorker.RefineRunner.handleGenerateRequest({
      intent: refineWorker.Intent.GENERATE,
      prompt,
      style,
      letters,
      modelId
    })
    if (!payload || !payload.text || !payload.text.length) return undefined
    return payload.text
  }

  static refinePrompt = async (prompt: string, modelId: number) => {
    const payload = await refineWorker.RefineRunner.handleGenerateRequest({
      intent: refineWorker.Intent.REFINE_PROMPT,
      prompt,
      style: undefined as unknown as string,
      letters: 0,
      modelId
    })
    if (!payload || !payload.text || !payload.text.length) return undefined
    return payload.text
  }

  stop = () => {
    this.stopped = true
  }
}
