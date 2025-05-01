import { _Model as __Model } from 'src/localstores/model/types'

export class _Model {
  private static topicModel = 'deepseek-ai/DeepSeek-V3-0324'

  private static _models = [] as __Model[]

  static initialize = (models: __Model[]) => {
    _Model._models = models
  }

  static randomPeek = (hostModel?: boolean) => {
    const models = _Model._models.filter(
      (op) => hostModel === undefined || op.host_model === hostModel
    )
    const index = Math.floor(Math.random() * models.length)
    return models[index]
  }

  static model = (id: number) => {
    return _Model._models.find((el) => el.id === id)
  }

  static _topicModel = () => {
    return _Model.topicModel
  }
}
