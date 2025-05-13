import { duanziWorker } from 'src/worker'

export class Duanzi {
  static generate = (
    historyMessages: string[],
    modelId: number,
    simulatorId: number,
    generateAudio?: boolean
  ): Promise<duanziWorker.GenerateResponsePayload> => {
    return new Promise((resolve, reject) => {
      duanziWorker.DuanziRunner.handleGenerateRequest({
        historyMessages,
        simulatorId,
        modelId,
        generateAudio
      })
        .then((payload) => {
          if (!payload) {
            return reject('Invalid results')
          }
          resolve(payload)
        })
        .catch((e) => {
          reject(e)
        })
    })
  }
}
