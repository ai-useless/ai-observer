import { v4 as uuidv4 } from 'uuid'
import { _Model } from './model'
import { _Simulator } from './simulator'
import { dbModel } from '../../model'
import { _Participator } from './participator'

export class _Seminar {
  static #seminars = [] as dbModel.Seminar[]

  static create = (topic: string) => {
    const _uid = uuidv4()
    const count = Math.ceil(Math.random() * 5 + 5)
    const participators = [] as dbModel.Participator[]

    for (let i = 0; i < count; i++) {
      const model = _Model.randomPeek(i === 0 ? true : undefined)
      const simulator = _Simulator.randomPeek(i === 0 ? true : undefined)
      participators.push({
        seminarUid: _uid,
        role: i === 0 ? dbModel.Role.HOST : dbModel.Role.GUEST,
        simulatorId: simulator?.id || 0,
        modelId: model?.id || 0
      })
    }

    _Participator.createParticipators(participators)
    _Seminar.#seminars.push({
      id: _Seminar.#seminars.length,
      uid: _uid,
      topic: topic
    })

    return _uid
  }

  static seminar = (_uid?: string, id?: number) => {
    return _Seminar.#seminars
      .find((el) => {
        if (_uid !== undefined) return el.uid === _uid
        if (id !== undefined) return el.id === id
        return false
      })
  }
}
