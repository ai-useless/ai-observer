import { chatWorker, refineWorker, speakWorker } from 'src/worker'

export class EChat {
  static chat = (
    simulatorId: number,
    simulator: string,
    personality: string,
    myName: string,
    messages: string[],
    modelId: number,
    language: string,
    onMessage: (message?: string, audio?: string, error?: string) => void
  ) => {
    chatWorker.ChatRunner.handleGenerateRequest({
      simulator,
      personality,
      myName,
      language,
      historyMessages: messages,
      modelId
    })
      .then((payload) => {
        if (!payload || !payload.text || !payload.text.length) {
          onMessage(
            undefined,
            undefined,
            '你的伙伴好像什么也没有发送给你！这是传说中的空包吗？'
          )
          return
        }
        speakWorker.SpeakRunner.handleSpeakRequest({
          simulatorId,
          text: payload.text
        }).then((payload1) => {
          if (!payload1 || !payload1.audio || !payload1.audio.length) {
            onMessage(payload.text, undefined, undefined)
            return
          }
          onMessage(payload.text, payload1.audio, undefined)
        }).catch((e) => {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          console.log(`Failed speak: ${e}`)
          onMessage(payload.text, undefined, undefined)
        })
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed generate: ${e}`)
        onMessage(undefined, undefined, '出错啦！再试试吧！')
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
}
