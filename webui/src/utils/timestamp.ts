export const timestamp2HumanReadable = (timestamp: number) => {
  const now = Date.now() / 1000
  const timestampSec = timestamp / 1000000
  if (now - timestampSec < 60) {
    return {
      msg: 'MSG_BEFORE_SECONDS',
      value: Math.floor(now - timestampSec)
    }
  }
  if (now - timestampSec < 3600) {
    return {
      msg: 'MSG_BEFORE_MINUTES',
      value: Math.floor((now - timestampSec) / 60)
    }
  }
  if (now - timestampSec < 3600 * 24) {
    return {
      msg: 'MSG_BEFORE_HOURS',
      value: Math.floor((now - timestampSec) / 3600)
    }
  }
  return {
    msg: 'MSG_BEFORE_DAYS',
    value: Math.floor((now - timestampSec) / 3600 / 24)
  }
}

export const getCurrentFormattedDate = (): string => {
  const now = new Date();

  // 获取年、月、日
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要加1
  const day = String(now.getDate()).padStart(2, '0');

  // 获取时、分、秒
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // 拼接成目标格式
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

