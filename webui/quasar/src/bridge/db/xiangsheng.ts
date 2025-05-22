import { dbModel } from '../../model'
import { _Participator } from './participator'
import { xiangshengWorker } from 'src/worker'

export class _Xiangsheng {
  private static xiangshengs = [] as dbModel.Xiangsheng[]

  static create = async (
    _uid: string,
    topic: string,
    participators: dbModel.Participator[],
    intent: xiangshengWorker.Intent
  ) => {
    await _Participator.createParticipators(participators)
    _Xiangsheng.xiangshengs.push({
      id: _Xiangsheng.xiangshengs.length,
      uid: _uid,
      topic,
      intent
    })

    return _uid
  }

  static xiangsheng = (_uid?: string, id?: number) => {
    return _Xiangsheng.xiangshengs.find((el) => {
      if (_uid !== undefined) return el.uid === _uid
      if (id !== undefined) return el.id === id
      return false
    })
  }
}
