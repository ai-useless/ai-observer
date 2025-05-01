import { seminarWorker } from 'src/worker'
import { dbBridge } from '..'

export class Topic {
  static generateTopics = (
    topicType: string,
    count: number,
    historyTopics: seminarWorker.HistoryMessage[]
  ): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      seminarWorker.SeminarRunner.handleGenerateTopics({
        prompts: {
          model: dbBridge._Model._topicModel(),
          count,
          topicType,
          historyMessages: historyTopics
        }
      })
        .then((payload) => {
          if (!payload) {
            return reject('Invalid topics')
          }
          resolve(payload.topics)
        })
        .catch((e) => {
          reject(e)
        })
    })
  }
}
