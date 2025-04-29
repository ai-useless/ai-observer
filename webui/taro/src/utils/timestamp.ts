export const timestamp2HumanReadable = (timestamp: number) => {
  const now = Date.now() / 1000
  const timestampSec = timestamp

  if (now - timestampSec < 10) {
    return '刚刚'
  }

  if (now - timestampSec < 60) {
    return `${Math.floor(now - timestampSec)}秒前`
  }
  if (now - timestampSec < 3600) {
    return `${Math.floor((now - timestampSec) / 60)}分钟前`
  }
  if (now - timestampSec < 3600 * 24) {
    return `${Math.floor((now - timestampSec) / 3600)}小时前`
  }
  return `${Math.floor((now - timestampSec) / 3600 / 24)}天前`
}
