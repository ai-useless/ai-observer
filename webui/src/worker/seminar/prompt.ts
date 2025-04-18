export enum Intent {
  OUTLINE = 'Outline',
  DISCUSS = 'Discuss',
  START_TOPIC = 'StartTopic',
  START_SUBTOPIC = 'StartSubTopic',
  CONCLUDE_SUBTOPIC = 'ConcludeSubTopic',
  CONCLUDE = 'Conclude'
}

type IntentFunc = (...args: (string | number | string[])[]) => string

export const Prompts = new Map<Intent, IntentFunc>([
  [
    Intent.OUTLINE,
    ((
      topic: string,
      rounds: number
    ) => `请你就“${topic}”这个主题，拆解出${rounds || 5}个递进层次的小主题，要求只输出主题和主题
                                       相关素材（格式如下：本期主题：xxxxx,(1).xxxxx，素材：xxxx；(2).xxxxxxx，素材：xxxxxxx）`) as IntentFunc
  ],
  [
    Intent.DISCUSS,
    ((
      topic: string,
      subTopic: string,
      personality: string,
      hostMessage: string,
      speakDuration: number
    ) => `你的人设是${personality}，本期节目讨论的主题为${topic}, 本轮讨论的小主题为${subTopic}，本期节目
                                       主持人对你说的话为："${hostMessage}"，请你作为嘉宾，用你的人设发表你对该小主题的看法，要求：1) 只把发言内容
                                       输出出来，不允许有表情，标签，换行符和提示 2) 发言时间≤${speakDuration}秒，小于100字 3) 发言内容符合自己的人设和主观 4) 人物情绪普遍理性客观中立，但带有各自社群特征`) as IntentFunc
  ],
  [
    Intent.START_TOPIC,
    ((
      personality: string,
      topicMaterial: string,
      speakDuration: number
    ) => `你的人设是${personality}，现在是节目的开始，本期节目的主要内容为：${topicMaterial}，
                                       请你就主要内容做一个简单的开场，需达成：1) 发言时间≤${speakDuration}秒,小于100字 2) 只输出发言内容，不允许有表情，标签，换行符和提示 3) 人物情绪普遍理性客观中立，但带有各自社群特征`) as IntentFunc
  ],
  [
    Intent.START_SUBTOPIC,
    ((
      topic: string,
      personality: string,
      topicMaterial: string,
      subTopic: string,
      speakDuration: number
    ) => `你的人设是${personality}，今天讨论的主题为："${topic}",
                                       本期节目的主要内容为${topicMaterial}, 之前你已经对主题进行过开场并组织讨论了小主题${subTopic}, 现在进入小主题${subTopic}总结阶段阶段，以“那么我们进入下一个讨论主体”结束，要求：
                                       1)直接输出发言内容，不允许有表情，标签，换行符和提示 2) 发言时间≤${speakDuration}秒，小于100字 3) 人物情绪普遍理性客观中立，但带有各自社群特征`) as IntentFunc
  ],
  [
    Intent.CONCLUDE_SUBTOPIC,
    ((
      topic: string,
      personality: string,
      subTopic: string,
      speakDuration: number
    ) => `你的人设是${personality}，今天讨论的主题为："${topic}",之前你已经对主题进行过开场
                                       现在进入小主题讨论阶段，本轮主要讨论的是${subTopic}这个小主题，请就这个小主题拓展和开场，并且结尾要抛出问题让嘉宾来讨论,以“下面有请嘉宾发言”结束，要求：
                                       1)直接输出发言内容，不允许有表情，标签，换行符和提示 2) 发言时间≤${speakDuration}秒，小于100字 3) 人物情绪普遍理性客观中立，但带有各自社群特征`) as IntentFunc
  ],
  [
    Intent.CONCLUDE,
    ((
      personality: string,
      topicMaterial: string,
      speakDuration: number
    ) => `你的人设是${personality}，现在是节目的最后，本期节目的主要内容为：${topicMaterial}，
                                       请你对本期内容进行总结陈词，需达成：1) 发言时间≤${speakDuration}秒,小于100字 2) 只输出发言内容，不允许有表情，标签，换行符和提示 3) 人物情绪普遍理性客观中立，但带有各自社群特征`) as IntentFunc
  ]
])

export class Prompt {
  static prompt = (intent: Intent, ...args: (string | number)[]) => {
    const _args = [...args]
    return Prompts.get(intent)?.(..._args)
  }

  static postProcess = (
    intent: Intent,
    content: string
  ): Record<string, unknown> | undefined => {
    const json = {
      titles: [] as string[]
    } as Record<string, string[]>

    if (intent === Intent.OUTLINE) {
      const lines = content.split('\n')
      for (const line of lines) {
        if (/^\(*\d+\)*/i.test(line)) {
          json.titles.push(
            line
              .split(', 素材')[0]
              .split(' 素材')[0]
              .split('，素材')[0]
              .replace(/:$/, '')
              .replace(',**', '**')
          )
        }
      }
      return json
    }
    return undefined
  }
}
