import { dbSeminar } from 'src/controller'
import { dbModel } from 'src/model'

export class _Model {
  private static topicModel = 'deepseek-ai/DeepSeek-V3-0324'

  static initialize = async (models: dbModel.Model[]) => {
    for (const model of models) {
      try {
        await dbSeminar.models.add(model)
      } catch {
        await dbSeminar.models.update(model, model)
      }
    }
  }

  static randomPeek = async (hostModel?: boolean) => {
    const models = (await dbSeminar.models.toArray()).filter(
      (op) =>
        (hostModel === undefined || op.host_model === hostModel) && !op.disabled
    )
    const index = Math.floor(Math.random() * models.length)
    return models[index]
  }

  static model = async (id: number) => {
    return (await dbSeminar.models.toArray())
      .filter((el) => !el.disabled)
      .find((el) => el.id === id)
  }

  static topicModelId = async () => {
    const topicModel = (await dbSeminar.models.toArray()).find(
      (el) => el.name === _Model.topicModel
    )
    return topicModel ? topicModel.id : 0
  }

  static _topicModel = () => {
    return _Model.topicModel
  }

  static models = async () => {
    return await dbSeminar.models.toArray()
  }
}
