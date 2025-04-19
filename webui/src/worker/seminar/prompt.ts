export enum Intent {
  OUTLINE = 'Outline',
  DISCUSS = 'Discuss',
  START_TOPIC = 'StartTopic',
  START_FIRST_SUBTOPIC = 'StartFirstTopic',
  START_SUBTOPIC = 'StartSubTopic',
  CONCLUDE_SUBTOPIC = 'ConcludeSubTopic',
  CONCLUDE = 'Conclude'
}

enum PromptType {
  NO_HEAD_SPACE,
  IDENT_2_SPACE,
  WITH_HTML,
  HTML_STYLE,
  SEGMENT,
  NO_EMOJI,
  DURATION,
  PERSONALITY,
  EMOTION,
  NO_ANALYSIS,
  MERGE_SPACES,
  DONT_START_WITH_TOPIC
}

type RequirementFunc = (...args: (string | number | string[])[]) => string

const Requirements = new Map<PromptType, RequirementFunc>([
  [PromptType.NO_HEAD_SPACE, (() => ') 行首不要有空格') as RequirementFunc],
  [
    PromptType.IDENT_2_SPACE,
    (() => ') 分级资料按照2个空格缩进') as RequirementFunc
  ],
  [
    PromptType.WITH_HTML,
    (() => ') 要html格式，不要返回markdown') as RequirementFunc
  ],
  [
    PromptType.HTML_STYLE,
    (() =>
      ') 一级标题用16号字加粗，二级标题用14号字加粗，普通内容不加粗，行高1.5em') as RequirementFunc
  ],
  [PromptType.SEGMENT, (() => ') 根据语义需要分段') as RequirementFunc],
  [
    PromptType.NO_EMOJI,
    (() =>
      ') 只把发言内容输出出来，不允许有表情，标签，换行符和提示') as RequirementFunc
  ],
  [
    PromptType.DURATION,
    ((speakDuration: number, letters: number) =>
      `) 发言时间≤${speakDuration}秒，小于${letters}字`) as RequirementFunc
  ],
  [
    PromptType.PERSONALITY,
    (() => ') 发言内容符合自己的人设，观点明确，事实充分') as RequirementFunc
  ],
  [
    PromptType.EMOTION,
    (() => ') 人物情绪普遍理性客观中立，但带有各自社群特征') as RequirementFunc
  ],
  [PromptType.NO_ANALYSIS, (() => ') 不要包含分析过程') as RequirementFunc],
  [
    PromptType.MERGE_SPACES,
    (() => ') 把连续多个空格合并成一个') as RequirementFunc
  ],
  [
    PromptType.DONT_START_WITH_TOPIC,
    (() => ') 不要生硬的用主题开头') as RequirementFunc
  ]
])

type IntentFunc = (...args: (string | number | string[])[]) => string

const IntentRequirements = new Map<Intent, PromptType[]>([
  [
    Intent.OUTLINE,
    [
      PromptType.NO_EMOJI,
      PromptType.IDENT_2_SPACE,
      PromptType.WITH_HTML,
      PromptType.HTML_STYLE,
      PromptType.SEGMENT,
      PromptType.NO_HEAD_SPACE,
      PromptType.MERGE_SPACES
    ]
  ],
  [
    Intent.DISCUSS,
    [
      PromptType.NO_EMOJI,
      PromptType.DURATION,
      PromptType.PERSONALITY,
      PromptType.EMOTION,
      PromptType.NO_ANALYSIS,
      PromptType.NO_HEAD_SPACE,
      PromptType.IDENT_2_SPACE,
      PromptType.WITH_HTML,
      PromptType.MERGE_SPACES,
      PromptType.HTML_STYLE,
      PromptType.DONT_START_WITH_TOPIC
    ]
  ],
  [
    Intent.START_TOPIC,
    [
      PromptType.NO_EMOJI,
      PromptType.DURATION,
      PromptType.PERSONALITY,
      PromptType.EMOTION,
      PromptType.NO_ANALYSIS,
      PromptType.NO_HEAD_SPACE,
      PromptType.IDENT_2_SPACE,
      PromptType.WITH_HTML,
      PromptType.MERGE_SPACES,
      PromptType.HTML_STYLE,
      PromptType.DONT_START_WITH_TOPIC
    ]
  ],
  [
    Intent.START_FIRST_SUBTOPIC,
    [
      PromptType.NO_EMOJI,
      PromptType.DURATION,
      PromptType.PERSONALITY,
      PromptType.EMOTION,
      PromptType.NO_ANALYSIS,
      PromptType.NO_HEAD_SPACE,
      PromptType.IDENT_2_SPACE,
      PromptType.WITH_HTML,
      PromptType.MERGE_SPACES,
      PromptType.HTML_STYLE,
      PromptType.DONT_START_WITH_TOPIC
    ]
  ],
  [
    Intent.START_SUBTOPIC,
    [
      PromptType.NO_EMOJI,
      PromptType.DURATION,
      PromptType.PERSONALITY,
      PromptType.EMOTION,
      PromptType.NO_ANALYSIS,
      PromptType.NO_HEAD_SPACE,
      PromptType.IDENT_2_SPACE,
      PromptType.WITH_HTML,
      PromptType.MERGE_SPACES,
      PromptType.HTML_STYLE,
      PromptType.DONT_START_WITH_TOPIC
    ]
  ],
  [
    Intent.CONCLUDE_SUBTOPIC,
    [
      PromptType.NO_EMOJI,
      PromptType.DURATION,
      PromptType.PERSONALITY,
      PromptType.EMOTION,
      PromptType.NO_ANALYSIS,
      PromptType.NO_HEAD_SPACE,
      PromptType.IDENT_2_SPACE,
      PromptType.WITH_HTML,
      PromptType.MERGE_SPACES,
      PromptType.HTML_STYLE,
      PromptType.DONT_START_WITH_TOPIC
    ]
  ],
  [
    Intent.CONCLUDE,
    [
      PromptType.NO_EMOJI,
      PromptType.DURATION,
      PromptType.PERSONALITY,
      PromptType.EMOTION,
      PromptType.NO_ANALYSIS,
      PromptType.NO_HEAD_SPACE,
      PromptType.IDENT_2_SPACE,
      PromptType.WITH_HTML,
      PromptType.MERGE_SPACES,
      PromptType.HTML_STYLE,
      PromptType.DONT_START_WITH_TOPIC
    ]
  ]
])

const intentRequirements = (
  intent: Intent,
  ...args: (string | number | string[])[]
) => {
  return (
    IntentRequirements.get(intent)
      ?.map(
        (el, index) =>
          index.toString() + (Requirements.get(el)?.(...args) || '')
      )
      ?.join(' ') || ''
  )
}

export const IntentPrompt = new Map<Intent, IntentFunc>([
  [
    Intent.OUTLINE,
    ((
      topic: string,
      rounds: number
    ) => `请你就“${topic}”这个主题，拆解出${rounds || 5}个递进层次的小主题，要求只输出主题和主题
          相关素材（格式如下：本期主题：xxxxx,(1).xxxxx，素材：xxxx；(2).xxxxxxx，素材：xxxxxxx）,
          要求: ${intentRequirements(Intent.OUTLINE)}`) as IntentFunc
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
          主持人对你说的话为："${hostMessage}"，请你作为嘉宾，用你的人设发表你对该小主题的看法
          要求: ${intentRequirements(Intent.DISCUSS, speakDuration, 100)}`) as IntentFunc
  ],
  [
    Intent.START_TOPIC,
    ((
      personality: string,
      topicMaterial: string,
      speakDuration: number
    ) => `你的人设是${personality}，现在是节目的开始，本期节目的主要内容为：${topicMaterial}，
          请你就主要内容做一个简单的开场，要求：${intentRequirements(Intent.START_TOPIC, speakDuration, 300)}`) as IntentFunc
  ],
  [
    Intent.START_FIRST_SUBTOPIC,
    ((
      topic: string,
      personality: string,
      topicMaterial: string,
      subTopic: string,
      speakDuration: number
    ) => `你的人设是${personality}，今天讨论的主题为："${topic}",
          本期节目的主要内容为${topicMaterial}, 现在进入今天的第一个主题主题${subTopic}，以“那么我们进从${subTopic}开始”结束
          要求：${intentRequirements(Intent.START_FIRST_SUBTOPIC, speakDuration, 300)}`) as IntentFunc
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
          本期节目的主要内容为${topicMaterial}, 之前你已经对主题进行过开场并组织讨论了小主题${subTopic}, 现在进入小主题${subTopic}总结阶段，
          以“那么我们进入下一个讨论主题”结束，要求：${intentRequirements(Intent.START_SUBTOPIC, speakDuration, 300)}`) as IntentFunc
  ],
  [
    Intent.CONCLUDE_SUBTOPIC,
    ((
      topic: string,
      personality: string,
      subTopic: string,
      speakDuration: number
    ) => `你的人设是${personality}，今天讨论的主题为："${topic}",之前你已经对主题进行过开场
          现在进入小主题讨论阶段，本轮主要讨论的是${subTopic}这个小主题，请就这个小主题拓展和开场，并且结尾要抛出问题让嘉宾来讨论，
          以“下面有请嘉宾发言”结束，要求：${intentRequirements(Intent.CONCLUDE_SUBTOPIC, speakDuration, 300)}`) as IntentFunc
  ],
  [
    Intent.CONCLUDE,
    ((
      personality: string,
      topicMaterial: string,
      speakDuration: number
    ) => `你的人设是${personality}，现在是节目的最后，本期节目的主要内容为：${topicMaterial}，
          请你对本期内容进行总结陈词，需达成：${intentRequirements(Intent.CONCLUDE, speakDuration, 300)}`) as IntentFunc
  ]
])

export class Prompt {
  static prompt = (intent: Intent, ...args: (string | number)[]) => {
    const _args = [...args]
    return IntentPrompt.get(intent)?.(..._args)
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
        if (/>\(*\d+\)*/i.test(line)) {
          json.titles.push(line)
        }
      }
      return json
    }
    return undefined
  }
}
