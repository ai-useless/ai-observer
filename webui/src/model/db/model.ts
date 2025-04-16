import { _hex } from '../../utils'
import { keccak } from 'hash-wasm'
import { MsgData } from '../../localstore/chat/types'

export const ownerFromPublicKey = async (publicKey: string) => {
  const publicKeyBytes = _hex.toBytes(publicKey)
  const typeNameBytes = new TextEncoder().encode('Ed25519PublicKey::')
  const bytes = new Uint8Array([...typeNameBytes, ...publicKeyBytes])
  return await keccak(bytes, 256)
}

export interface ChatSession {
  session_id: string
  data: MsgData[]
}
