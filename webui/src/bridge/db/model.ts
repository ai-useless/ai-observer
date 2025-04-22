import { dbSeminar } from 'src/controller'

import { chutesLogo } from 'src/assets'

export class _Model {
  static #models = [
    {
      name: 'deepseek-ai/DeepSeek-V3-0324',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        '***REMOVED***',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/deepseek.webp',
      vendorLogo: chutesLogo,
      hostModel: true
    },
    {
      name: 'chutesai/Mistral-Small-3.1-24B-Instruct-2503',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        '***REMOVED***',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/mistral.webp',
      vendorLogo: chutesLogo,
      hostModel: false
    },
    {
      name: 'deepseek-ai/DeepSeek-R1',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        '***REMOVED***',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/qwen.webp',
      vendorLogo: chutesLogo,
      hostModel: true
    },
    {
      name: 'chutesai/Llama-4-Maverick-17B-128E-Instruct-FP8',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        '***REMOVED***',
      vendor: 'Chutes',
      author: 'Meta',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/qwen.webp',
      vendorLogo: chutesLogo,
      hostModel: true
    }
  ]

  static initialize = async () => {
    try {
      await dbSeminar.models.bulkPut(_Model.#models)
    } catch {
      // DO NOTHING
    }
  }

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
}
