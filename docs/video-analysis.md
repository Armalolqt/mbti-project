# 三个参考视频：制作流程、Prompt 与配乐分析

> 分析方法：逐帧抽图（看画面、读屏幕上的 prompt）、读烧录字幕（还原口播）、ffmpeg 镜头切点检测、librosa 节拍/调性分析。
> 三个视频都来自抖音：视频 1 是 @nowhy_feng 的教程，视频 2、3 是 @AbyssStudio 的作品。

---

## 视频 1：《Vibe 知识大赏》保姆级教程（208 秒，960×720）

### 1.1 这条视频在讲什么

博主在拆解最近刷屏的“Vibe 知识大赏”科普视频（有的号只发了几条就拿到一百多万赞、涨粉十几万）。核心结论是：

> 这类视频**不是拍出来的**，是**让 AI 写代码（Remotion）**，按分镜一幕一幕“画”出来的。
> 不管讲什么知识，只需要 **四步**。

口播还原（按时间线）：

| 时间 | 内容 |
|---|---|
| 0:00–0:20 | 今年见过涨粉起号最快、成本最低的方法；被“Vibe 知识大赏”刷屏 |
| 0:20–0:42 | 原理很简单：AI 写代码，按分镜画出来，四步搞定 |
| 0:44–1:17 | **第一步 定规格**：告诉 AI 做知识科普，主题 XXX（如蝴蝶效应、人类发展史），用 Remotion，1080p、30 帧、16:9 横屏，不配音、用中文字幕讲清楚，配上固定音乐（“Vibe 知识小曲”） |
| 1:18–1:52 | **第二步 卡点**：最上头的就是画面每动一下都踩在节奏上。先让 AI 分析音乐，测出每分钟多少拍（演示里是 112～113 BPM）、每个重拍在第几秒，再要求画面每变一次都落在重拍上 |
| 1:52–2:18 | **第三步 配音效**：像《纪念碑谷》那种“叮叮咚咚”的音效，也是 AI 用代码直接合成的。每个关键动作配一个音，音色要契合画面重点的乐器；画面越关键音效越好听，越容易产生共鸣 |
| 2:18–2:40 | **第四步 试片**：AI 一次成片质量不高，先做开头 10 秒，再逐段推进，哪段不好换哪段。同一模型对比：“先试片、一轮一轮改”5 轮约 37 分钟；“一句话一次出片”1 轮约 6 分钟，前者质量高很多 |
| 2:41–2:58 | 模型选择：试过 Opus 5.5 和 GPT-6，Opus 5.5 审美“独一档”，做这类视频很难替代 |
| 2:58–3:12 | 成本：订阅、AI 套餐或中转，单条成本 **< 5 元** |
| 3:12–3:28 | 四段完整提示词放在屏幕上，截图保存 |

### 1.2 原版四段 Prompt（视频结尾屏幕原文）

```
01 定规格
帮我做一部知识科普视频，主题：【换成你的主题】。用 Remotion 来做，1920×1080，30 帧，16:9 横屏；
不配音，用中文字幕把知识点讲清楚；配乐用文件夹里这首音乐。

02 卡点
先分析这首音乐，测出每分钟多少拍，把每个重拍在第几秒列出来；画面每变一次，都落在重拍上。

03 配音效
每个关键动作都配一个音，用代码合成；音色用契合画面重点的乐器。

04 试片
先做开头 10 秒给我看；我确认后再一段一段往下做，哪段不好就重做那一段。
```

### 1.3 画面风格（从演示片《蝴蝶效应》《信息论》里归纳）

原版 prompt 没写风格，是模型自己发挥的。想“做一样的”，需要把风格写死：

- **底色**：深海军蓝 / 近黑（约 `#0B1220` → `#111A2E` 径向渐变），带轻微暗角
- **强调色**：香槟金 / 暖金（约 `#E8C26A`），关键数字、关键词、发光点用金色
- **字体**：标题用宋体/衬线（思源宋体），细字距拉开（如“蝴 蝶 效 应”）；说明文字用细黑体
- **HUD 元素**：四角细线取景框、左上小号英文标签（`MY OWN FILM`、`SOUND ON`、`REFERENCE FILM`），底部进度条/章节点
- **典型画面**：点阵网格 + 金色光点弹跳（弹珠/高尔顿板）、数字递增动画（0.1 → 0.6 → 3.7 → 320 毫米）、发光细线连成曲线、金色小蝴蝶、阶梯折线逐级点亮、对照数字（1.000000 vs 1.000001）
- **字幕**：底部居中小字，中文一行 + 可选英文副行，逐句淡入
- **运动**：所有出现/切换落在重拍；元素用缓动（ease-out）淡入、轻微上浮，光点有拖尾和辉光

### 1.4 配乐

- 原视频说用的是这个系列“固定的音乐”（博主称“Vibe 知识小曲”），演示里测出来是 **112～113 BPM**
- **视频里没有出现歌名**，口播里博主的声音和音乐叠在一起，没法干净地扒出来
- 获取办法：在抖音打开任意一条“Vibe 知识大赏”视频 → 点右下角旋转的音乐唱片 → 看歌名 / 收藏 /“拍同款”。发布时直接在抖音里挂这个原声，既有版权，又能吃到同款音乐的流量
- 制作时把这首歌的音频文件（mp3/wav）放进项目文件夹即可（prompt 第 1 段写的“文件夹里这首音乐”）

### 1.5 我能否复刻：**能，整条链路都能在这个环境里跑通**

| 环节 | 怎么做 | 状态 |
|---|---|---|
| Remotion 工程 | Node 22 已就绪，`npx create-video` 搭工程 | ✅ |
| 测 BPM 和重拍 | librosa 已装好，已经用它分析过视频 2、3 | ✅ |
| 分镜动画 | React + Remotion 写每一幕，用 `beats.json` 驱动切换时间 | ✅ |
| 代码合成音效 | 用 Python/numpy 合成钢琴/钟琴/木琴类“叮咚”音（正弦 + 泛音 + 指数衰减 + 混响），按关键动作时间点混进音轨 | ✅ |
| 渲染 MP4 | 环境里自带 Chromium，Remotion 可以直接渲染 | ✅ |
| 配乐 | **需要你提供音频文件** | ⏳ 待提供 |

### 1.6 我执行时会用的增强版 Prompt（在原版基础上把风格、节拍、音效写清楚）

```
帮我做一部知识科普视频，主题：【主题】，时长约 60 秒。
技术：Remotion，1920×1080，30fps，16:9 横屏；不配音，用中文字幕讲清楚知识点；配乐用 assets/music.mp3。

【风格】深海军蓝近黑底 + 香槟金强调色；标题用衬线宋体、拉开字距；四角细线取景框、左上英文小标签、
底部章节进度点；画面以点阵、发光细线、数字递增、金色光点为主，极简、留白多、有辉光和暗角。

【结构】片名卡（踩第一个强拍）→ 引子（一个反直觉的问题）→ 3～4 个知识点，每个点一幕视觉隐喻 →
收束金句 → 片尾。每幕 1 句主字幕，最多 1 句副字幕。

【卡点】先用代码分析音乐：输出 BPM、每个重拍时间点（秒）到 beats.json；
所有镜头切换、元素出现、数字跳变，都对齐到最近的重拍帧（帧号 = round(秒 × 30)）。

【音效】每个关键动作配一个合成音：光点落下用钟琴，数字跳变用木琴短音，线条连通用柔和钢琴和弦，
片名用低频“嗡”+ 高频闪光；音量比配乐低 6～10dB，统一加短混响。

【流程】先只做开头 10 秒并渲染给我看；我确认后再一段一段往下做，哪段不好只重做那段。
```

---

## 视频 2：AbyssStudio「忧郁气质」雾景短片（17.4 秒，1280×720，60fps）

### 2.1 镜头表（有效内容 0～14.4 秒，之后是抖音片尾卡）

| # | 时间 | 画面 | 运镜 |
|---|---|---|---|
| 1 | 0.0–4.6 | 浓雾草地上一棵孤树（中景），前景草叶带露水、虚焦 | 极慢横移/推近 |
| 2 | 4.6–7.1 | 两棵扭曲老树的剪影，雾从背后飘过（月桂林那种） | 缓慢横移 |
| 3 | 7.1–10.5 | 暴风雨前的灰绿色海面，厚云压低，远处一个小黑点（岛/礁/人） | 几乎固定，海浪慢动 |
| 4 | 10.5–14.4 | 海面上成群海鸥起飞、掠过水面 | 慢动作 |

- **左下/底部居中水印**：细衬线大写 `ABYSS`，极低不透明度
- **调色**：整体压暗、低饱和，青蓝/灰绿色调（teal & grey），高光压住，暗部发青，轻颗粒
- **剪辑**：硬切，切点都在拍上，每镜约 **3～4 拍（≈ 一小节）**，节奏很慢

### 2.2 配乐分析

- 速度约 **72 BPM**（慢板），频谱重心很低（≈530Hz）：偏低音钢琴/大提琴/氛围 Pad 的暗色器乐
- 调性倾向 D / G（大概率 D 小调或 G 调附近）
- 能量曲线：0～3 秒渐强进入，3～14 秒平稳，14 秒后收尾——典型“氛围器乐剪一段 15 秒”
- 视频里**没有歌名**；片尾卡的搜索词是“忧郁气质为什么吸引人”，是话题词不是歌名。需要在抖音原视频点音乐唱片看歌名

---

## 视频 3：AbyssStudio 城市夜景/阴天氛围片（19.9 秒，1280×720，60fps）

### 3.1 镜头表（有效内容 0～16.8 秒）

| # | 时间 | 画面 |
|---|---|---|
| 1 | 0.0–2.3 | 全黑中浮现 `A B Y S S` 片名，暗处树影，一条黑色竖幕向一侧揭开露出阴云天空 |
| 2 | 2.3–3.4 | 仰拍高楼外立面，冷蓝色 |
| 3 | 3.4–4.4 | 翻滚的暴风云，边缘被月光勾亮 |
| 4 | 4.4–6.5 | 夜晚公园步道，几盏圆形路灯，湿地面反光（这一镜 4 拍） |
| 5 | 6.5–7.5 | 暗背景里几朵白花特写 |
| 6 | 7.5–8.6 | 樱花枝特写，浅景深 |
| 7 | 8.6–9.7 | 仰拍树冠剪影衬着灰白天空 |
| 8 | 9.7–10.7 | 雾中林荫小路，远处一个独行的人 |
| 9 | 10.7–12.8 | 树枝剪影 + 路灯杆，阴天 |
| 10 | 12.8–14.9 | 夜里空地上一盏路灯照着堆放的杂物，远处城市天际线灯光 |
| 11 | 14.9–16.8 | 透过树干看到的摩天轮剪影 |

- **调色**：和视频 2 同一套——低曝光、冷青蓝、压饱和，部分镜头几乎只剩剪影
- **剪辑**：严格卡点，切点和节拍几乎完全重合（误差 < 0.03 秒），**每 2 拍一切（≈1.04 秒）**，重点镜头停 4 拍
- **转场**：开头一个黑色竖幕擦除（wipe）揭开画面，其余都是硬切
- **片名**：细衬线大写、字距很宽的 `ABYSS`，居中、低不透明度，片中也作为水印

### 3.2 配乐分析

- 速度约 **117～118 BPM**，频谱重心 ≈1000Hz，比视频 2 明亮，有清晰的节拍层
- 调性倾向 F 小调 / 降 A 大调一带（F、E♭、D♭、A♭ 最强）
- 片尾卡搜索词是 **“we never 纯音乐”**——说明这首是一首歌名里带 “We Never …” 的歌的**纯音乐/伴奏版**。在抖音或 QQ 音乐/网易云搜 “we never 纯音乐” 就能找到。**视频里没有写全名，我不乱猜具体是哪一首**

---

## 视频 2、3 的复刻思路

这两条是**实拍/素材 + 卡点剪辑 + 统一调色**的氛围片，关键在“素材气质 + 卡点 + 调色”，不是动画。

### 我能做的部分
1. 用 librosa 测配乐的 BPM 和重拍
2. 用 ffmpeg 按重拍自动切镜（每 2 拍或 4 拍一切）
3. 统一调色：压曝光、降饱和、阴影偏青、加暗角和细颗粒（可做成一个固定 LUT/滤镜链）
4. 加 `ABYSS` 式的衬线宽字距片名和水印、黑幕擦除转场
5. 输出 16:9 或竖屏版本

### 需要你提供 / 外部生成的部分
这个环境里**没有视频生成模型**，素材需要二选一：
- **自己拍**：阴天、傍晚蓝调时刻、夜晚路灯、雾天，手机即可，后期压暗
- **AI 生成**：用可灵 / 即梦 / 海螺 / Veo / Seedance 等，每镜 5 秒

### 视频 2 每个镜头的 AI 生成 Prompt（英文版对大多数模型效果更稳）

```
1. A lone gnarled tree standing on a misty grass field at blue hour, thick fog, dewy grass blades
   in the blurred foreground, very slow dolly forward, moody, desaturated teal-grey color grade,
   low exposure, cinematic 35mm film grain, shallow depth of field, 16:9
2. Two twisted ancient laurel trees in silhouette, dense fog drifting behind them, slow lateral
   camera slide, melancholic atmosphere, muted blue-green tones, cinematic, film grain
3. A dark stormy sea under heavy low clouds, grey-green water, gentle waves, a tiny distant rock
   on the horizon, static wide shot, gloomy and quiet, desaturated, cinematic
4. A flock of seagulls taking off and skimming over a dark grey ocean surface, slow motion,
   overcast twilight, muted teal palette, moody cinematic, film grain
```

### 视频 3 每个镜头的 AI 生成 Prompt

```
1. Dark tree silhouettes against a stormy night sky, almost black frame, moonlit cloud edges,
   static, cinematic, low key, cold blue tone
2. Low-angle shot of a modern building facade at dusk, cold blue tint, slow tilt up, moody
3. Rolling storm clouds at night lit by moonlight from behind, time-lapse feel, dramatic, dark blue
4. An empty park path at night with round globe street lamps, wet pavement reflections,
   slow push in, lonely mood, desaturated teal
5. Close-up of a few white flowers against a dark background, gentle breeze, shallow depth of field
6. Cherry blossom branches close-up under an overcast sky, soft focus, muted pastel-grey grade
7. Looking up at tree canopy silhouette against a pale grey sky, slow rotation, melancholic
8. A foggy tree-lined path with a lone person walking away in the distance, overcast, cinematic
9. A single street lamp lighting an empty lot at night, city skyline lights in the distance, static
10. A Ferris wheel silhouette seen through dark tree trunks at blue hour, slow lateral move
通用后缀：desaturated, low exposure, cold teal-blue color grade, cinematic film grain,
anamorphic look, 16:9, no text
```

### 剪辑参数（直接照抄即可得到同样的节奏）

| | 视频 2 | 视频 3 |
|---|---|---|
| BPM | ≈72 | ≈117.5 |
| 每拍时长 | ≈0.85 秒 | ≈0.51 秒 |
| 每镜长度 | 3～4 拍（2.5～4.6 秒） | 2 拍为主（≈1.04 秒），重点镜头 4 拍 |
| 镜头数 | 4 | 11 |
| 转场 | 全硬切 | 开头黑幕擦除，其余硬切 |
| 成片长度 | ≈14.5 秒 | ≈17 秒 |

---

## 下一步需要你确认的

1. **视频 1**：选一个主题（比如和你的 MBTI 项目结合：“为什么 INFJ 只占 1%”“MBTI 的 16 种人格从哪来”），并把那首“Vibe 知识小曲”的音频文件发给我 → 我按四步流程先出开头 10 秒
2. **视频 2、3**：把配乐音频和素材（自己拍或 AI 生成的 5 秒片段）发给我 → 我做卡点剪辑 + 调色 + 片名
