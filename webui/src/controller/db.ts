import Dexie, { Table } from 'dexie'
import { dbModel } from 'src/model'

export const dbKline = new Dexie('KLineDatabase') as Dexie & {
  chatSessions: Table<dbModel.ChatSession, string>
}

dbKline.version(1).stores({
  chatSessions: 'session_id'
})
