import { AudioPlayer } from 'src/player'
import { purify, timestamp } from 'src/utils'

export interface Message {
  message: string
  audio: string
  index: number
  timestamp: number
  datetime?: string
}

export interface TypingMessage<T extends Message> {
  typingMessage?: T
  lastDisplayMessage?: T
  typingInterval?: number
  audioPlayer?: AudioPlayer
  typingMessageIndex?: number
  typingTicker?: number
}

function calculateTypingInterval<T extends Message>(typingMessage: T, duration: number): number | undefined {
  if (typingMessage.audio && typingMessage.audio.length && typingMessage.message && typingMessage.message.length) {
    return Math.ceil(duration * 1000 / purify.purifyText(typingMessage.message).length)
  }
  return undefined
}

export async function typing<T extends Message>(
  waitMessages: Map<string, T>,
  displayMessages: T[],
  typingMessage: T | undefined,
  lastDisplayMessage: T | undefined,
  typingMessageIndex: number,
  audioPlayer: AudioPlayer | undefined,
  enablePlay: boolean,
  typingTicker: number,
  resetLastDisplayMessage: () => void,
  typingFunc: () => void
): Promise<TypingMessage<T> | undefined> {
  if (!typingMessage && !waitMessages.size) return Promise.resolve(undefined)

  // If we have a message in typing, finish it
  if (typingMessage && lastDisplayMessage && lastDisplayMessage.message.length < typingMessage.message.length) {
    if (lastDisplayMessage.message.length > 0 && audioPlayer && !audioPlayer.playing) {
      lastDisplayMessage.message = typingMessage.message
      return Promise.resolve(undefined)
    }
    const matches = typingMessage.message.slice(lastDisplayMessage.message.length).match(/^<[^>]+>/) || []
    const appendLen = matches[0] ? matches[0].length + 1 : 1
    lastDisplayMessage.message = typingMessage.message.slice(0, lastDisplayMessage.message.length + appendLen)
    return Promise.resolve(undefined)
  }

  if (lastDisplayMessage) {
    if (displayMessages.findIndex((el) => lastDisplayMessage && el.index === lastDisplayMessage.index && el.message === lastDisplayMessage.message) < 0) {
      displayMessages.push(lastDisplayMessage)
    }
    resetLastDisplayMessage()
  }

  if (!waitMessages.size) return Promise.resolve(undefined)
  // If audio is still playing, do nothing
  if (audioPlayer && audioPlayer.playing) return Promise.resolve(undefined)

  let key = undefined as unknown as string
  for (const k of Array.from(waitMessages.keys())) {
    const v = waitMessages.get(k)
    if (v && v.index === typingMessageIndex) {
      key = k
      break
    }
  }
  if (!key) return Promise.resolve(undefined)

  typingMessage = waitMessages.get(key) as T
  waitMessages.delete(key)
  typingMessageIndex += 1

  let typingInterval = undefined as unknown as number

  if (typingMessage.audio && typingMessage.audio.length && enablePlay) {
    try {
      if (audioPlayer) audioPlayer.stop()

      audioPlayer = await AudioPlayer.play(typingMessage.audio)
      if (audioPlayer && audioPlayer.duration) {
        typingInterval = calculateTypingInterval(typingMessage, audioPlayer.duration) || typingInterval
        if (typingTicker >= 0) window.clearInterval(typingTicker)
        typingTicker = window.setInterval(typingFunc, typingInterval)
      }
    } catch (e) {
      audioPlayer = undefined as unknown as AudioPlayer

      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Failed play: ${e}`)
    }
  }

  displayMessages.forEach((el) => {
    el.datetime = timestamp.timestamp2HumanReadable(el.timestamp)
  })

  lastDisplayMessage = {
    ...typingMessage,
    message: ''
  }

  return {
    typingMessage,
    lastDisplayMessage,
    audioPlayer,
    typingInterval,
    typingMessageIndex,
    typingTicker
  }
}
