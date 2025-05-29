import {
  duanziWorker,
  imageWorker,
  refineWorker,
  speakWorker
} from 'src/worker'
import { _Model } from '../db'
import { dbBridge } from '..'
import { uuid } from 'src/utils'

class OneDuanzi {
  title: string
  content: string
}

export class Duanzi {
  private stopped = false

  refineImagePrompt = async (
    text: string,
    messageUid: string,
    onImage: (messageUid: string, image: string) => void
  ) => {
    if (this.stopped) return

    refineWorker.RefineRunner.handleGenerateRequest({
      intent: refineWorker.Intent.REFINE_PROMPT,
      style: '内涵无厘头搞笑',
      prompt: text,
      letters: 0,
      modelId: await _Model.topicModelId()
    })
      .then((payload) => {
        if (!payload || !payload.text || !payload.text.length) return
        if (this.stopped) return

        imageWorker.ImageRunner.handleGenerateRequest({
          prompt: payload.text,
          style: '内涵无厘头搞笑漫画',
          dialog: false,
          extra:
            '图片中的搞笑人物头像可以使用不同的搞笑表情包头像。不允许出现真人头像。',
          highResolution: false,
          ratio: '16:9'
        })
          .then((_payload) => {
            if (_payload && _payload.image)
              onImage(messageUid, _payload.image)
          })
          .catch((e) => {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            console.log(`Failed generate image: ${e}`)
          })
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed refine: ${e}`)
      })
  }

  generateMedia = async (
    duanzis: OneDuanzi[],
    simulatorId: number,
    index: number,
    steps: number,
    generateAudio: boolean,
    generateImage: boolean,
    onMessage: (
      title: string,
      content: string,
      audio?: string,
      messageUid?: string
    ) => void,
    onImage: (messageUid: string, image: string) => void
  ) => {
    if (index >= duanzis.length) return
    if (this.stopped) return

    let duanzi = duanzis[index]

    const messageUid = uuid.newUuid()

    if (generateImage) {
      await this.refineImagePrompt(duanzi.content, messageUid, onImage)
    }

    const _simulator = dbBridge._Simulator.simulator(simulatorId)

    speakWorker.SpeakRunner.handleSpeakRequest({
      text: `${duanzi.title}：${duanzi.content}`,
      simulatorId,
      instruct: `用${_simulator ? _simulator.language : "中文"}说`
    })
      .then((payload) => {
        if (!payload) {
          onMessage(duanzi.title, duanzi.content, undefined, messageUid)
          void this.generateMedia(
            duanzis,
            simulatorId,
            index + steps,
            steps,
            generateAudio,
            true,
            onMessage,
            onImage
          )
          return
        }
        onMessage(duanzi.title, duanzi.content, payload.audio, messageUid)
        void this.generateMedia(
          duanzis,
          simulatorId,
          index + steps,
          steps,
          generateAudio,
          true,
          onMessage,
          onImage
        )
      })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Failed generate audio: ${e}`)
        onMessage(duanzi.title, duanzi.content, undefined, messageUid)
        void this.generateMedia(
          duanzis,
          simulatorId,
          index + steps,
          steps,
          generateAudio,
          true,
          onMessage,
          onImage
        )
      })
  }

  generate = async (
    historyMessages: string[],
    modelId: number,
    simulatorId: number,
    onMessage: (
      title: string,
      content: string,
      audio?: string,
      messageUid?: string
    ) => void,
    onImage: (messageUid: string, image: string) => void,
    generateAudio?: boolean
  ) => {
    if (this.stopped) return

    try {
      const payload = await duanziWorker.DuanziRunner.handleGenerateRequest({
        historyMessages,
        modelId
      })
      if (!payload) return

      if (this.stopped) return

      const duanzis = [] as OneDuanzi[]
      let title = ''
      let content = ''

      for (let text of payload.texts) {
        text = text.replace('*', '').replace('#', '').replace(' ', '')
        if (text.startsWith('标题')) {
          title = text.replace('标题：', '')
        } else if (text.startsWith('内容')) {
          content = text.replace('内容：', '')
        }
        if (title.length > 0 && content.length > 0) {
          duanzis.push({
            title,
            content
          })
          title = ''
          content = ''
        }
      }

      const steps = 5
      for (let i = 0; i < steps; i++) {
        if (this.stopped) return

        void this.generateMedia(
          duanzis,
          simulatorId,
          i,
          steps,
          generateAudio === undefined ? true : generateAudio,
          true,
          onMessage,
          onImage
        )
      }
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Failed generate: ${e}`)
    }
  }

  stop = () => {
    this.stopped = true
  }
}
