import { dbSeminar } from 'src/controller'
import { dbModel } from 'src/model'

export class _Model {
  private static topicModel = 'deepseek-ai/DeepSeek-V3-0324'

  static initialize = async (models: dbModel.Model[]) => {
    try {
      await dbSeminar.models.bulkPut(models)
    } catch {
      // DO NOTHING
    }
  }

  static randomPeek = async (hostModel?: boolean) => {
    const models = (await dbSeminar.models.toArray()).filter(
      (op) => hostModel === undefined || op.host_model === hostModel
    )
    const index = Math.floor(Math.random() * models.length)
    return models[index]
  }

  static model = async (id: number) => {
    return (await dbSeminar.models.toArray()).find((el) => el.id === id)
  }

  static _topicModel = () => {
    return _Model.topicModel
  }
}
