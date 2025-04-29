import { seminarWorker } from 'src/worker'
import { dbBridge } from '..'

export class Topic {
  static generateTopics = (
    topicType: string,
    count: number,
    historyTopics: string[]
  ): Promise<string[]> => {
    return new Promise((resolve, _reject) => {
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
            setTimeout(() => {
              Topic.generateTopics(topicType, count, historyTopics)
            }, 1000)
            return
          }
          resolve(payload.topics)
        })
        .catch(() => {
          setTimeout(() => {
            Topic.generateTopics(topicType, count, historyTopics)
          }, 1000)
        })
    })
  }
}
