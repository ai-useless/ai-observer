import { model } from 'src/localstores'

export class _Model {
  private static topicModel = 'deepseek-ai/DeepSeek-V3-0324'

  static randomPeek = (hostModel?: boolean) => {
    const models = model.Model.models().filter(
      (op) => hostModel === undefined || op.host_model === hostModel
    )
    const index = Math.floor(Math.random() * models.length)
    return models[index]
  }

  static model = (id: number) => {
    return model.Model.models().find((el) => el.id === id)
  }

  static _topicModel = () => {
    return _Model.topicModel
  }

  static topicModelId = () => {
    const topicModel = model.Model.models().find(
      (el) => el.name === _Model.topicModel
    )
    return topicModel ? topicModel.id : 0
  }

  static chatModelId = () => {
    return _Model.topicModelId()
  }
}
