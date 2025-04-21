import { luxunAvatar } from 'src/assets'
import { dbSeminar } from 'src/controller'

export class _Simulator {
  static #simulators = [
    {
      name: 'MSG_HUN_ER_HU',
      avatar: luxunAvatar,
      personality: '客观理性的AGI智障频道AGI观点栏目主持人',
      host: true,
      speakerVoice: 'zm_031'
    },
    {
      name: 'MSG_ZHU_TOU_SAN',
      avatar: luxunAvatar,
      personality: '知识丰富，关心前沿科技的科技公司创始人',
      host: false,
      speakerVoice: 'zm_010'
    },
    {
      name: 'MSG_AN_RUO_SU',
      avatar: luxunAvatar,
      personality: '国防大学教授，国务院特殊津贴专家',
      host: false,
      speakerVoice: 'zm_012'
    },
    {
      name: 'MSG_JIU_TOU_NIAO',
      avatar: luxunAvatar,
      personality: '科技爱好者，民间科学家',
      host: false,
      speakerVoice: 'zf_027'
    },
    {
      name: 'MSG_LUXUN',
      avatar: luxunAvatar,
      personality: '时事新闻媒体特约撰稿人',
      host: false,
      speakerVoice: 'zf_044'
    }
  ]

  static initialize = async () => {
    try {
      await dbSeminar.simulators.bulkPut(_Simulator.#simulators)
    } catch {
      // Ignore if exists
    }
  }

  static create = async (
    name: string,
    avatar: string,
    personality: string,
    host: boolean,
    speakerVoice: string
  ) => {
    await dbSeminar.simulators.add({
      name,
      avatar,
      personality,
      host,
      speakerVoice
    })
  }

  static simulators = async (ids: number[]) => {
    return await dbSeminar.simulators.where('id').anyOf(ids).toArray()
  }

  static randomPeek = async (host?: boolean) => {
    const simulators = await dbSeminar.simulators
      .filter((op) => host === undefined || op.host === host)
      .toArray()
    const index = Math.floor(Math.random() * simulators.length)
    return simulators[index]
  }

  static simulator = async (id: number) => {
    return await dbSeminar.simulators.filter((op) => op.id === id).first()
  }
}
