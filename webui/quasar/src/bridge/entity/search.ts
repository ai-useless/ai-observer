import { searchWorker } from 'src/worker'

export class Search {
  static search = (
    topic: string,
    historyMessages: string[],
    modelId: number,
    simulatorId: number,
    prompt?: string,
    generateAudio?: boolean
  ): Promise<searchWorker.SearchResponsePayload> => {
    return new Promise((resolve, reject) => {
      searchWorker.SearchRunner.handleSearchRequest({
        topic,
        historyMessages,
        prompt,
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
