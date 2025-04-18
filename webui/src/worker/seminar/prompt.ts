export enum Intent {
  OUTLINE = 'Outline',
  DISCUSS = 'Discuss'
}

type IntentFunc = (...args: (string | number)[]) => string

export const Prompts = new Map<Intent, IntentFunc>([
  [Intent.OUTLINE, ((topic: string, rounds: number) => `请你就“${topic}”这个主题，拆解出${rounds || 5}个递进层次的小主题，要求只输出主题和主题
                                                       相关素材（格式如下：本期主题：xxxxx,(1).xxxxx，素材：xxxx；(2).xxxxxxx，素材：xxxxxxx）`) as IntentFunc],
  [Intent.DISCUSS, ((topic: string, subTopic: string, personality: string, hostMessage: string, speakDuration: number) => `你的人设是${personality}，本期节目讨论的主题为${topic}, 本轮讨论的小主题为${subTopic}，本期节目
                                       主持人对你说的话为："${hostMessage}"，请你作为嘉宾，用你的人设发表你对该小主题的看法，要求：1) 只把发言内容
                                       输出出来，不允许有表情，标签，换行符和提示 2) 发言时间≤${speakDuration}秒，小于100字 3) 发言内容符合自己的人设和主观`) as IntentFunc]
])

export class Prompt {
  static prompt = (intent: Intent, ...args: (string | number)[]) => {
    const _args = [...args]
    return Prompts.get(intent)?.(..._args)
  }

  static outline = (content: string) => {
    console.log(content)
  }
}
