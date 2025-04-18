import { dbSeminar } from 'src/controller'

import { chutesLogo } from 'src/assets'

export class _Model {
  static #models = [
    {
      name: 'deepseek-ai/DeepSeek-V3-0324',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        'cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1',
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
        'cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/mistral.webp',
      vendorLogo: chutesLogo,
      hostModel: false
    },
    {
      name: 'cognitivecomputations/Dolphin3.0-Mistral-24B',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        'cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/mistral.webp',
      vendorLogo: chutesLogo,
      hostModel: false
    },
    {
      name: 'cognitivecomputations/Dolphin3.0-R1-Mistral-24B',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        'cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/mistral.webp',
      vendorLogo: chutesLogo,
      hostModel: false
    },
    {
      name: 'Qwen/Qwen2.5-VL-32B-Instruct',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        'cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo: 'https://cdn.rayonlabs.ai/chutes/logos/qwen.webp',
      vendorLogo: chutesLogo,
      hostModel: false
    },
    {
      name: 'open-r1/OlympicCoder-32B',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        'cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo:
        'https://logos.chutes.ai/logos/fb557002-9c42-403a-a670-4faa605e8bd3.webp',
      vendorLogo: chutesLogo,
      hostModel: false
    },
    {
      name: 'RekaAI/reka-flash-3',
      endpoint: 'https://llm.chutes.ai/v1/chat/completions',
      apiKey:
        'cpk_0c8fd15b154844d3a135fb0bbe3d46e2.5dcf47f7d7a95385b1ff82c6ead8b178.LDpSXZrZbaqh2T89jFRxViWck6VWFVg1',
      vendor: 'Chutes',
      author: 'High-Flyer',
      authorLogo:
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/High-Flyer.png',
      modelLogo:
        'https://logos.chutes.ai/logos/f35448ce-464f-4224-9971-61e957414576.webp',
      vendorLogo: chutesLogo,
      hostModel: false
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
