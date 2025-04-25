import { luxunAvatar } from 'src/assets'
import { dbSeminar } from 'src/controller'
import { dbModel } from 'src/model'

export class _Simulator {
  static #simulators = [
    {
      name: '渾二虎',
      avatar: luxunAvatar,
      personality: '客观理性的AGI智障频道AGI观点栏目主持人',
      host: true,
      speakerVoice: 'huyihu',
      archetype: '胡一虎',
      title: '凤凰卫视一虎一席谈节目主持人'
    },
    {
      name: '猪头三',
      avatar: luxunAvatar,
      personality: '知识丰富，关心前沿科技的科技公司创始人',
      host: false,
      speakerVoice: 'jay',
      archetype: '朱重八',
      title: '明朝开国皇帝朱元璋'
    },
    {
      name: '安若素',
      avatar: luxunAvatar,
      personality: '国防大学教授，国务院特殊津贴专家',
      host: false,
      speakerVoice: 'juzuo',
      archetype: '安又琪',
      title: '超级女声选秀比赛冠军'
    },
    {
      name: '九头鸟',
      avatar: luxunAvatar,
      personality: '科技爱好者，民间科学家',
      host: false,
      speakerVoice: 'dongqing',
      archetype: '九头鸟',
      title: '认为自己可以推翻相对论的民间科学家'
    },
    {
      name: '陆一讯',
      avatar: luxunAvatar,
      personality: '时事新闻媒体特约撰稿人',
      host: false,
      speakerVoice: 'miqi',
      archetype: '鲁迅',
      title: '愤世嫉俗的文艺青年'
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
    speakerVoice: string,
    archetype: string,
    title: string
  ) => {
    await dbSeminar.simulators.add({
      name,
      avatar,
      personality,
      host,
      speakerVoice,
      archetype,
      title
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

  static archetype = (simulator?: dbModel.Simulator) => {
    if (!simulator) return '朝阳区热心群众'
    return simulator?.title + simulator?.archetype
  }

  static archetypeWithId = async (simulatorId: number) => {
    const simulator = await dbSeminar.simulators
      .where('id')
      .equals(simulatorId)
      .first()
    return _Simulator.archetype(simulator)
  }
}
