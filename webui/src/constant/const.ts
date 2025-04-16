const URLS = [
  'http://api.blobgateway.com/api/blobs/chains/2da31f15909fa4babb15ecd14bf0cc45f70431e2d81dbbbd0da930255d41bd6e/applications/7f01736b5f1be034b19c5b09690af27e6d5482b8b4db984f4d53e799ef094992',
  'http://api.ams.respeer.ai/api/ams/chains/62dd60918d9e7f35a55c4e5e160466ed2c0b9c6ff01bc9b3a14520bc11853b19/applications/a5d01660a6770a4f9818b508ba50a3978924a8390c3b1fec1c598b0a33999538',
  'http://api.linerameme.fun/api/proxy/chains/84b133872bf6c509e1f15d429660d58a202705f2e383bae04399000de254ae0a/applications/deab8335b35db445bf2475377f15d8bf4700e4106692a1344ece57de01cc0338',
  'http://api.lineraswap.fun/api/swap/chains/d70ab62d6d769d79122a66d03d58bcbce170b9b52545482ac47ec6227fe2d34c/applications/bc905d223ab3bb328f71a1fe7516d6974058b00aa76ae899ddc7a5495e82c887'
]

export const APPLICATION_URLS = {
  BLOB_GATEWAY: URLS[0],
  AMS: URLS[1],
  PROXY: URLS[2],
  SWAP: URLS[3]
}

export const RPC_URL = 'http://api.rpc.respeer.ai/api/rpc'
export const RPC_WS_URL = 'ws://api.rpc.respeer.ai/ws'

export const formalizeSchema = (url: string) => {
  return url.replace(
    'http://',
    process.env.NODE_ENV === 'production' ? 'http://' : 'http://'
  )
}

export const applicationId = (url: string) => {
  return url.split('/').at(-1)
}

export const chainId = (url: string) => {
  return url.split('/').at(-3)
}

export const LINERA_TICKER = 'TLINERA'
export const LINERA_NATIVE_ID = LINERA_TICKER
export const LINERA_LOGO =
  'https://avatars.githubusercontent.com/u/107513858?s=48&v=4'

export const KLINE_WS_URL = 'ws://api.kline.lineraswap.fun/api/kline/ws'
export const KLINE_HTTP_URL = 'http://api.kline.lineraswap.fun/api/kline'
export const AI_CHAT_HTTP_URL = 'http://172.16.30.61:8091/api/get-response'
