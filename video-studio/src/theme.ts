// 视觉规格：深海军蓝底 + 香槟金强调色（模仿「Vibe 知识大赏」系列）
export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const C = {
  bgCenter: '#15203a',
  bgEdge: '#05080f',
  gold: '#e8c26a',
  goldSoft: 'rgba(232, 194, 106, 0.35)',
  goldFaint: 'rgba(232, 194, 106, 0.12)',
  text: '#ece6d6',
  dim: '#7d869a',
  line: 'rgba(214, 200, 160, 0.22)',
  blue: '#7fa8d8',
};

export const SERIF = '"Noto Serif SC", "Songti SC", serif';
export const SANS = '"Noto Sans SC", "PingFang SC", sans-serif';

export const glow = (color = C.gold, r = 18) =>
  `0 0 ${r * 0.4}px ${color}, 0 0 ${r}px ${color}, 0 0 ${r * 2.2}px rgba(232,194,106,0.35)`;
