import { dbSeminar } from 'src/controller'

export class _Model {
  private static topicModel = 'deepseek-ai/DeepSeek-V3-0324'

  static create = async (
    name: string,
    endpoint: string,
    apiKey: string | undefined,
    vendor: string,
    author: string,
    authorLogo: string,
    modelLogo: string,
    vendorLogo: string,
    hostModel: boolean
  ) => {
    return await dbSeminar.models.add({
      name,
      endpoint,
      apiKey,
      vendor,
      author,
      authorLogo,
      modelLogo,
      vendorLogo,
      hostModel
    })
  }

  static randomPeek = async (hostModel?: boolean) => {
    const count = await dbSeminar.models
      .filter((op) => hostModel === undefined || op.hostModel === hostModel)
      .count()
    const index = Math.floor(Math.random() * count)
    return (
      await dbSeminar.models
        .filter((op) => hostModel === undefined || op.hostModel === hostModel)
        .toArray()
    )[index]
  }

  static model = async (id: number) => {
    return await dbSeminar.models.filter((op) => op.id === id).first()
  }

  static _topicModel = () => _Model.topicModel
}
