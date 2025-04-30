import { _Model } from './model'
import { _Simulator } from './simulator'
import { dbModel } from '../../model'
import { _Participator } from './participator'

export class _Seminar {
  private static seminars = [] as dbModel.Seminar[]

  static create = (_uid: string, topic: string, participators: dbModel.Participator[]) => {
    _Participator.createParticipators(participators)
    _Seminar.seminars.push({
      id: _Seminar.seminars.length,
      uid: _uid,
      topic: topic
    })

    return _uid
  }

  static seminar = (_uid?: string, id?: number) => {
    return _Seminar.seminars.find((el) => {
      if (_uid !== undefined) return el.uid === _uid
      if (id !== undefined) return el.id === id
      return false
    })
  }
}
