import { dbSeminar } from 'src/controller'
import { dbModel } from 'src/model'
import { _Participator } from './participator'

export class _Seminar {
  static create = async (
    _uid: string,
    topic: string,
    participators: dbModel.Participator[]
  ) => {
    await dbSeminar.transaction(
      'rw',
      dbSeminar.seminars,
      dbSeminar.participators,
      async () => {
        await _Participator.createParticipators(participators)
        await dbSeminar.seminars.add({
          uid: _uid,
          topic: topic
        })
      }
    )
  }

  static seminar = async (_uid?: string, id?: number) => {
    return await dbSeminar.seminars
      .filter((op) => {
        if (_uid !== undefined) return op.uid === _uid
        if (id !== undefined) return op.id === id
        return false
      })
      .first()
  }
}
