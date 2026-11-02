# Vibe 视频工作室

模仿抖音「Vibe 知识大赏」科普视频（参考视频 1），以及 AbyssStudio 忧郁氛围片（参考视频 2、3）的制作工程。
三个参考视频的拆解见 [`../docs/video-analysis.md`](../docs/video-analysis.md)。

```
video-studio/
├── src/
│   ├── film.ts          ← 分镜表：场景、字幕、音效时间点（改主题主要改这里）
│   ├── scenes.tsx       ← 7 个场景的动画
│   ├── components.tsx   ← 取景框 HUD、字幕、背景、音轨
│   ├── timing.ts        ← 「拍 → 帧」换算，所有动画都踩在拍上
│   ├── theme.ts         ← 配色和字体（深海军蓝 + 香槟金）
│   └── data/beats.json  ← 配乐节拍（脚本生成）
├── public/
│   ├── music.mp3        ← 配乐（现在是占位曲，换成正式配乐）
│   └── sfx/             ← 代码合成的叮咚音效
└── tools/
    ├── analyze_beats.py       第 2 步「卡点」：测 BPM 和重拍
    ├── synth_sfx.py           第 3 步「配音效」：合成钟琴/木琴/钢琴等音效
    ├── make_placeholder_music.py  生成 112 BPM 占位配乐
    └── beatcut.py             视频 2/3 式氛围片：按拍切镜 + 调色 + 片名
```

## 一、科普视频（模仿视频 1）

已经做好一条示范片《十六型人格，从哪里来》：44 秒，7 幕，所有切换和音效都落在拍上。

```bash
npm install                 # 首次
pip install librosa         # 首次（测拍用）

npm run studio              # 浏览器里实时预览、拖时间轴
npm run render:opening      # 第 4 步「试片」：只渲染开头约 10 秒 → out/opening10s.mp4
npm run render:full         # 渲染整片 → out/film.mp4
```

### 换成正式配乐（重要）

现在 `public/music.mp3` 是我合成的 **占位曲**（112 BPM，和原系列的速度接近），只是为了把流程跑通。

1. 在抖音点开任意一条「Vibe 知识大赏」视频，点右下角旋转的音乐唱片，找到那首歌并下载或收藏
2. 把音频放到 `public/music.mp3`（其他格式先转换：`ffmpeg -i 你的歌.m4a public/music.mp3`）
3. `npm run beats` 重新测拍。画面时间轴是按「拍」写的，会自动对齐新歌
4. `npm run render:opening` 看开头效果

发抖音时建议在 App 里给视频挂上同一首原声：有版权，还能吃到同款音乐的流量。

### 换主题

- **只改文案**：改 `src/film.ts` 里的 `CAPTIONS`（字幕）、`SERIES`（系列名）
- **改音效**：改 `src/film.ts` 里的 `CUES`。可用音效见 `public/sfx/`，音名越高越亮，按 C D E G A 往上走最好听
- **整条换新主题**：把参考视频里的四段 prompt 发给 Claude，并说明「在 video-studio 工程里按现有风格做」。Claude 会改 `film.ts` 和 `scenes.tsx`，先出开头 10 秒

## 二、忧郁氛围片（模仿视频 2、3）

```bash
# 视频 3 的节奏：117 BPM，基本每 2 拍一切，重点镜头 4 拍
python3 tools/beatcut.py --music 配乐.mp3 --clips 素材/ --pattern 4,2,2,4,2,2,2,2,4,2,2 --out out/mood3.mp4

# 视频 2 的节奏：72 BPM，慢，每镜 3～4 拍，不要黑幕
python3 tools/beatcut.py --music 配乐.mp3 --clips 素材/ --pattern 4,3,4,4 --no-wipe --title "" --out out/mood2.mp4

# 竖屏
python3 tools/beatcut.py ... --size 1080x1920
```

- 素材按文件名顺序使用（建议命名 `01.mp4`、`02.mp4`……），每段 3～5 秒就够，脚本会截取每段素材的中间部分
- 调色预设 `abyss`：压暗、降饱和、阴影偏青、暗角、细颗粒；`--grade none` 关闭
- 素材可以自己拍（阴天、蓝调时刻、夜晚路灯、雾天），也可以用 AI 生成，每个镜头的生成 prompt 见 `docs/video-analysis.md`
