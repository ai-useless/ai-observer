import { luxunAvatar } from 'src/assets'
import { dbSeminar } from 'src/controller'

export class _Simulator {
  static #simulators = [
    {
      name: 'MSG_HUN_ER_HU',
      avatar: luxunAvatar,
      personality: 'MSG_CYNICISM',
      host: true
    },
    {
      name: 'MSG_ZHU_TOU_SAN',
      avatar: luxunAvatar,
      personality: 'MSG_CYNICISM',
      host: false
    },
    {
      name: 'MSG_AN_RUO_SU',
      avatar: luxunAvatar,
      personality: 'MSG_CYNICISM',
      host: false
    },
    {
      name: 'MSG_JIU_TOU_NIAO',
      avatar: luxunAvatar,
      personality: 'MSG_CYNICISM',
      host: false
    },
    {
      name: 'MSG_LUXUN',
      avatar: luxunAvatar,
      personality: 'MSG_CYNICISM',
      host: false
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
    host: boolean
  ) => {
    await dbSeminar.simulators.add({
      name,
      avatar,
      personality,
      host
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
