// ============================================================================
// 分镜表：改主题 / 改文案 / 改音效，基本只动这个文件。
// 所有时间单位都是「拍」（beat），由 src/data/beats.json 换算成帧。
// 示范主题：《十六型人格，从哪里来》
// ============================================================================

export type SceneId = 'title' | 'hook' | 'jung' | 'briggs' | 'tree' | 'grid' | 'ending';

export const SCENES: {id: SceneId; start: number; end: number; chapter: number}[] = [
  {id: 'title', start: 0, end: 12, chapter: 0},
  {id: 'hook', start: 12, end: 20, chapter: 0},
  {id: 'jung', start: 20, end: 32, chapter: 1},
  {id: 'briggs', start: 32, end: 44, chapter: 2},
  {id: 'tree', start: 44, end: 58, chapter: 3},
  {id: 'grid', start: 58, end: 68, chapter: 3},
  {id: 'ending', start: 68, end: 82, chapter: 4},
];

export const CHAPTERS = ['开篇', '荣格', '问卷', '十六型', '结语'];

/** 配乐文件（放在 public/ 下）。换歌后记得重跑：npm run beats */
export const MUSIC_FILE = 'music.mp3';
/** 所有音效的总音量系数 */
export const SFX_GAIN = 0.85;

export const SERIES = {
  name: '十六型人格',
  episode: '维度之学',
  /** 频道名：显示在右上角，做成频道后每期都一样 */
  channel: '风的攻略',
  topLeft: 'SOUND ON · 建议开声音',
};

/** 开头试片的长度（拍）：20 拍 @112BPM ≈ 10.7 秒 */
export const OPENING_BEATS = 20;
export const FILM_BEATS = 82;

// 字幕：在第 beat 拍出现，持续到 end 拍
export const CAPTIONS: {beat: number; end: number; zh: string; en?: string}[] = [
  {beat: 12, end: 16, zh: '你一定做过这套测试。', en: "You've probably taken this test."},
  {beat: 16, end: 20, zh: '可这个「16」，是怎么来的？', en: 'But where does sixteen come from?'},
  {beat: 24, end: 28, zh: '1921 年，荣格出版了《心理类型》。', en: 'In 1921, Carl Jung published Psychological Types.'},
  {beat: 28, end: 32, zh: '他先分内倾与外倾，再看你如何感知、如何判断。', en: 'Introversion or extraversion — then how you perceive, and how you judge.'},
  {beat: 32, end: 38, zh: '二十多年后，一对母女把它做成了一份问卷。', en: 'Two decades later, a mother and daughter turned it into a questionnaire.'},
  {beat: 40, end: 44, zh: '她们补上第四个维度：判断 J，还是感知 P。', en: 'They added a fourth axis: judging or perceiving.'},
  {beat: 44, end: 52, zh: '四个维度，每个二选一。', en: 'Four axes. Pick one side of each.'},
  {beat: 52, end: 58, zh: '2 × 2 × 2 × 2 = 16', en: 'Two to the fourth power.'},
  {beat: 58, end: 66, zh: '这就是我们熟悉的十六型人格。', en: 'And that is the sixteen types we know.'},
  {beat: 68, end: 72, zh: '它不是科学定论，', en: 'It is not settled science,'},
  {beat: 72, end: 78, zh: '却是一张认识自己的好用地图。', en: 'but it is a handy map of yourself.'},
];

// 音效：第 beat 拍播放 public/sfx/<sfx>.wav（由 tools/synth_sfx.py 生成）
export const CUES: {beat: number; sfx: string; vol?: number}[] = [
  // 片名
  {beat: 0, sfx: 'bell_C6', vol: 0.7},
  {beat: 0, sfx: 'boom', vol: 0.35},
  {beat: 2, sfx: 'whoosh', vol: 0.3},
  {beat: 4, sfx: 'shimmer', vol: 0.5},
  {beat: 4, sfx: 'boom', vol: 0.5},
  {beat: 6, sfx: 'marimba_E5', vol: 0.55},
  {beat: 8, sfx: 'tick', vol: 0.4},
  // 钩子：字母每拍翻一次
  {beat: 12, sfx: 'marimba_A5', vol: 0.45},
  {beat: 13, sfx: 'tick', vol: 0.45},
  {beat: 14, sfx: 'tick', vol: 0.45},
  {beat: 15, sfx: 'tick', vol: 0.45},
  {beat: 16, sfx: 'bell_A5', vol: 0.7},
  {beat: 16, sfx: 'piano_Am', vol: 0.5},
  {beat: 18, sfx: 'bell_E6', vol: 0.35},
  // 荣格：年份计数
  {beat: 20, sfx: 'tick', vol: 0.5},
  {beat: 21, sfx: 'tick', vol: 0.5},
  {beat: 22, sfx: 'tick', vol: 0.5},
  {beat: 23, sfx: 'tick', vol: 0.5},
  {beat: 24, sfx: 'marimba_G5', vol: 0.65},
  {beat: 26, sfx: 'bell_D5', vol: 0.6},
  {beat: 28, sfx: 'marimba_E5', vol: 0.5},
  {beat: 29, sfx: 'marimba_G5', vol: 0.5},
  // 问卷：每拍勾一项
  {beat: 32, sfx: 'tick', vol: 0.4},
  {beat: 33, sfx: 'tick', vol: 0.4},
  {beat: 34, sfx: 'tick', vol: 0.4},
  {beat: 35, sfx: 'tick', vol: 0.4},
  {beat: 36, sfx: 'tick', vol: 0.4},
  {beat: 38, sfx: 'marimba_D5', vol: 0.55},
  {beat: 40, sfx: 'bell_G5', vol: 0.65},
  {beat: 40, sfx: 'piano_F', vol: 0.45},
  // 二叉分裂：音高逐级上升
  {beat: 44, sfx: 'marimba_C5', vol: 0.5},
  {beat: 46, sfx: 'bell_C5', vol: 0.6},
  {beat: 48, sfx: 'bell_E5', vol: 0.6},
  {beat: 50, sfx: 'bell_G5', vol: 0.6},
  {beat: 52, sfx: 'bell_C6', vol: 0.65},
  {beat: 52, sfx: 'shimmer', vol: 0.45},
  {beat: 54, sfx: 'piano_C', vol: 0.45},
  // 16 宫格：一行一个音
  {beat: 58, sfx: 'marimba_C5', vol: 0.5},
  {beat: 59, sfx: 'marimba_E5', vol: 0.5},
  {beat: 60, sfx: 'marimba_G5', vol: 0.5},
  {beat: 61, sfx: 'marimba_C6', vol: 0.5},
  {beat: 63, sfx: 'whoosh', vol: 0.3},
  {beat: 64, sfx: 'shimmer', vol: 0.45},
  // 结尾
  {beat: 68, sfx: 'piano_Am', vol: 0.5},
  {beat: 72, sfx: 'piano_F', vol: 0.45},
  {beat: 72, sfx: 'bell_A5', vol: 0.5},
  {beat: 76, sfx: 'shimmer', vol: 0.45},
  {beat: 76, sfx: 'boom', vol: 0.3},
];

// 16 型（按常见的类型表排列）
export const TYPES: {code: string; name: string}[][] = [
  [{code: 'ISTJ', name: '物流师'}, {code: 'ISFJ', name: '守卫者'}, {code: 'INFJ', name: '提倡者'}, {code: 'INTJ', name: '建筑师'}],
  [{code: 'ISTP', name: '鉴赏家'}, {code: 'ISFP', name: '探险家'}, {code: 'INFP', name: '调停者'}, {code: 'INTP', name: '逻辑学家'}],
  [{code: 'ESTP', name: '企业家'}, {code: 'ESFP', name: '表演者'}, {code: 'ENFP', name: '竞选者'}, {code: 'ENTP', name: '辩论家'}],
  [{code: 'ESTJ', name: '总经理'}, {code: 'ESFJ', name: '执政官'}, {code: 'ENFJ', name: '主人公'}, {code: 'ENTJ', name: '指挥官'}],
];
