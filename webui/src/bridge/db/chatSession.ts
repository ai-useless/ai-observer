import { dbKline } from 'src/controller'
import { MsgData, SessionMsg } from 'src/localstore/chat/types'

export class ChatSession {
  static bulkPut = async (
      sessionId: string,
      datas: MsgData[]
  ) => {
    const traceFunc = console.trace
    console.trace = () => {
      // DO NOTHING
    }
    try {
      // 使用事务来确保操作的原子性
      await dbKline.transaction('rw', dbKline.chatSessions, async () => {
        // 查找现有记录
        const existingRecord = await dbKline.chatSessions.get(sessionId);

        // 合并数据
        let updatedData: SessionMsg;
        if (existingRecord) {
          // 如果记录存在，合并data数组
          updatedData = {
            session_id: sessionId,
            data: [...existingRecord.data, ...datas]
          };
        } else {
          // 如果记录不存在，创建新记录
          updatedData = {
            session_id: sessionId,
            data: datas
          };
        }

        // 使用bulkPut替换整个记录
        await dbKline.chatSessions.bulkPut([updatedData]);
      });
    } catch (error) {
      console.error('数据累加失败:', error);
    }

    console.trace = traceFunc
  }
  
  static getChatSessions = async (
    offset: number,
    limit: number
  ) => {
    const datas = await dbKline.chatSessions
      .offset(offset)
      .limit(limit)
      .toArray()
    return datas
  }

  static getTotalSessions = async () => {
    try {
      return await dbKline.chatSessions.count()
    } catch (error) {
      console.error('获取总记录数失败:', error)
      return 0
    }
  }
}
