import { dbSeminar } from 'src/controller'

import { chutesLogo } from 'src/assets'

export class _Model {
  static #models = [{
    name: 'deepseek-ai/DeepSeek-V3-0324',
    endpoint: 'https://llm.chutes.ai/v1/chat/completions',
    apiKey: 'cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1',
    vendor: 'Chutes',
    author: 'High-Flyer',
    authorLogo: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
    modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/deepseek.webp',
    vendorLogo: chutesLogo
  }]

  static initialize =async () => {
    try {
      await dbSeminar.models.bulkPut(_Model.#models)
    } catch {
      // DO NOTHING
    }
  }

  static create = async (name: string, endpoint: string, apiKey: string | undefined, vendor: string, author: string, authorLogo: string, modelLogo: string, vendorLogo: string) => {
    return await dbSeminar.models.add({
      name,
      endpoint,
      apiKey,
      vendor,
      author,
      authorLogo,
      modelLogo,
      vendorLogo
    })
  }

  static randomPeek = async () => {
    const index = Math.floor(Math.random() * await dbSeminar.models.count())
    return (await dbSeminar.models.toArray())[index]
  }

  static model = async (id: number) => {
    return await dbSeminar.models.filter((op) => op.id === id).first()
  }
}
