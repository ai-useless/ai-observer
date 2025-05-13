export enum Intent {
  GENERATE = 'Generate'
}

enum PromptType {
  NO_HEAD_SPACE,
  WITH_HTML,
  HTML_STYLE,
  SEGMENT,
  NO_EMOJI,
  MERGE_SPACES,
  WITH_HISTORY_ANALYSIS,
  WITHOUT_POLITICAL,
  MUST_OBEY
}

type RequirementFunc = (...args: (string | number | string[])[]) => string

const Requirements = new Map<PromptType, RequirementFunc>([
  [PromptType.NO_HEAD_SPACE, (() => ') 行首不要有空格；') as RequirementFunc],
  [PromptType.WITH_HTML, (() => ') 输出格式为纯HTML；') as RequirementFunc],
  [
    PromptType.HTML_STYLE,
    (() =>
      ') 一级标题字体14px加粗，二级标题12px加粗，正文12px常规字体，行高1.5em；') as RequirementFunc
  ],
  [PromptType.SEGMENT, (() => ') 根据语义合理分段；') as RequirementFunc],
  [
    PromptType.NO_EMOJI,
    (() => ') 不包含表情、标签、换行符或额外提示；') as RequirementFunc
  ],
  [
    PromptType.MERGE_SPACES,
    (() => ') 行首无多余空格，连续空格合并为一个；') as RequirementFunc
  ],
  [
    PromptType.WITH_HISTORY_ANALYSIS,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ((historyMessages: string[]) =>
      historyMessages.length
        ? `) 用户已经获取到下列内容 ${historyMessages.map((el, index) => index.toString() + ') ' + el).join('; ')}; `
        : '') as RequirementFunc
  ],
  [
    PromptType.WITHOUT_POLITICAL,
    (() =>
      ') 不涉及国家领导人及相关政策内容，确保符合公序良俗和现行法规; ') as RequirementFunc
  ],
  [
    PromptType.MUST_OBEY,
    (() => '请严格遵守以上要求，结构清晰，内容完整。') as RequirementFunc
  ]
])

type IntentFunc = (...args: (string | number | string[])[]) => string

const IntentRequirements = new Map<Intent, PromptType[]>([
  [
    Intent.GENERATE,
    [
      PromptType.NO_EMOJI,
      PromptType.WITH_HTML,
      PromptType.HTML_STYLE,
      PromptType.SEGMENT,
      PromptType.NO_HEAD_SPACE,
      PromptType.MERGE_SPACES,
      PromptType.WITHOUT_POLITICAL,
      PromptType.MUST_OBEY
    ]
  ]
])

const intentRequirements = (
  intent: Intent,
  ...args: (string | number | string[])[]
) => {
  const requirements = IntentRequirements.get(intent)
  if (!requirements) throw Error('Invalid intent')
  return (
    requirements
      .map((el, index) => {
        const _requirement = Requirements.get(el)
        if (!_requirement) throw Error('Invalid requirement')
        return index.toString() + (_requirement(...args) || '')
      })
      .join(' ') || ''
  )
}

export const IntentPrompt = new Map<Intent, IntentFunc>([
  [
    Intent.GENERATE,
    ((
      historyMessages: string[]
    ) => `你是一个比李诞还棒的搞笑段子创作者，请创作5个符合中国人笑点的不同领域不同题材的像内涵段子和糗事百科一样的搞笑段子，可以尝试试用谐音梗、生活观察、反转等元素，
          关注潜台词解码、逻辑颠覆和热点捕捉。每个段子字数60字以内，包含没有序号的标题，段子内容需要包含人物、事件以及过程。下面的这些是内涵段子较为经典的段子可以作为参考：
          1 往脖子上贴了个纹身贴画，骗我那二货男友真纹身，然后问他想在屁股上也纹个图案，不知道纹什么好？结果他说纹一卷卫生纸吧，省得擦屁股了。
          2 有次和女人聊天：我：“在吗？” 女神：“嗯。” 我：“聊会吧。” 女神：“嗯。” 我：“做我女朋友吧。” 女神：“啊。” 我：“我是认真的。” 女神：“哦。” 我：“你这是职业病吗？老是嗯嗯啊啊哦哦的。” 女神……
          3 哥们第一次去女朋友家，一家亲戚吃饭喝酒，这货挺能喝，大家都喜欢，大姐夫说打麻将呗？哥们说不会，又问扑克呢？哥们说不好赌，没学过。家里人满意了，问平时喝酒都干嘛？哥们说偶尔找两个妹纸玩玩。
          4 女友近视眼，一直没配眼镜，说戴眼镜不好看，我给她配了副隐形眼镜，她整个世界明亮了，看我一眼淡定说：“分手吧。”
          5 有个人说我长得帅，我笑了，他却说我笑起来更帅。唉，他这个就这个毛病，太诚实了！
          6 本人从来不迷信，小时候算命的说我能考上清华，我用实际行动证明这不科学。
          7 地球上曾出现过会说话的兔子，生性胆小，舌头结构和鹦鹉类似，会学人说话，学名叫埃及垂耳长毛兔，现已灭绝。别问我怎么知道的，我也是瞎编的。
          8 做男人一定要给女人安全感，如果给不了安全感，请给她幽默感；如果连幽默感都给不了，请给她舒服感；如果连舒服感都给不了，那请放开她，让我来！
          9 哥们给介绍对象，见面前叮嘱穿好点，我穿最贵的羽绒服去，结果女的见了转身走了，我热得跟狗一样，她倒好，招呼都不打就走了。
          10男：“你觉得我像啥？” 女：“海胆！” 男：“你是说我外表坚强，内心柔软吗？” 女：“不，外表丑，里面黄！”
          不同的段子单独一段，标题单独一行，需要HTML格式，标题居中，段子之间相隔16px。要求: ${intentRequirements(Intent.GENERATE, historyMessages)}`) as IntentFunc
  ]
])

export class Prompt {
  static prompt = (intent: Intent, ...args: (string | number | string[])[]) => {
    const _args = [...args]
    const intentPrompt = IntentPrompt.get(intent)
    if (!intentPrompt) throw Error('Invalid intent')
    return intentPrompt(..._args)
  }
}
