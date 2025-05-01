import { v4 as uuidv4 } from 'uuid'
import { dbSeminar } from 'src/controller'
import { _Model } from './model'
import { _Simulator } from './simulator'
import { dbModel } from 'src/model'
import { _Participator } from './participator'

export class _Seminar {
  static create = async (topic: string) => {
    const _uid = uuidv4()
    const count = Math.ceil(Math.random() * 5 + 5)
    const participators = [] as dbModel.Participator[]

    for (let i = 0; i < count; i++) {
      while (true) {
        let simulator = _Simulator.randomPeek(i === 0 ? true : undefined)
        if (!simulator) simulator = _Simulator.randomPeek()
        if (participators.findIndex((el) => el.simulatorId === simulator.id))
          continue

        let model = _Model.randomPeek(i === 0 ? true : undefined)
        if (!model) model = _Model.randomPeek()

        participators.push({
          seminarUid: _uid,
          role: i === 0 ? dbModel.Role.HOST : dbModel.Role.GUEST,
          simulatorId: simulator?.id || 0,
          modelId: model?.id || 0
        })
        break
      }
    }

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
    return _uid
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
