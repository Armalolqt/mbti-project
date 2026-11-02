import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {GlowDot} from './components';
import {TYPES} from './film';
import {C, glow, SANS, SERIF} from './theme';
import {bf, lerp, pop, ramp} from './timing';

/** 场景内用「第 k 拍」换算局部帧号 */
const useBeats = (start: number) => {
  const frame = useCurrentFrame();
  const at = (k: number) => bf(start + k) - bf(start);
  return {frame, at};
};

const center: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
};

// ============================================================================
// 1. 片名：一个金点 → 拉成线 → 片名浮现
export const TitleScene: React.FC<{start: number}> = ({start}) => {
  const {frame, at} = useBeats(start);
  const dot = pop(frame, at(0));
  const line = ramp(frame, at(2), 14);
  const title = ramp(frame, at(4), 16);
  const sub = ramp(frame, at(6), 12);
  const en = ramp(frame, at(8), 12);
  const push = lerp(frame, 0, at(12), 1, 1.045);
  const lineW = 40 + line * 620;
  return (
    <AbsoluteFill style={{transform: `scale(${push})`}}>
      {/* 中线 */}
      <div
        style={{
          ...center,
          width: lineW,
          height: 2,
          marginLeft: -lineW / 2,
          marginTop: 30,
          opacity: line,
          background: `linear-gradient(90deg, rgba(232,194,106,0), ${C.gold} 30%, ${C.gold} 70%, rgba(232,194,106,0))`,
        }}
      />
      {/* 线两端的小星点 */}
      {[-1, 1].map((s) => (
        <GlowDot
          key={s}
          size={8}
          style={{...center, marginTop: 27, marginLeft: s * (lineW / 2) - 4, opacity: line}}
        />
      ))}
      {/* 中心金点 */}
      <GlowDot
        size={18}
        style={{...center, marginLeft: -9, marginTop: 22, transform: `scale(${dot * (1 - line * 0.45)})`}}
      />
      {/* 片名 */}
      <div
        style={{
          ...center,
          width: 1400,
          marginLeft: -700,
          marginTop: -150,
          textAlign: 'center',
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: 118,
          letterSpacing: '0.42em',
          paddingLeft: '0.42em',
          color: C.text,
          opacity: title,
          filter: `blur(${(1 - title) * 10}px)`,
          transform: `translateY(${(1 - title) * 24}px)`,
          textShadow: `0 0 40px rgba(232,194,106,${0.25 * title})`,
        }}
      >
        十六型人格
      </div>
      <div
        style={{
          ...center,
          width: 1000,
          marginLeft: -500,
          marginTop: 62,
          textAlign: 'center',
          fontFamily: SERIF,
          fontSize: 36,
          letterSpacing: '0.3em',
          color: C.gold,
          opacity: sub,
          transform: `translateY(${(1 - sub) * 12}px)`,
        }}
      >
        MBTI · 它从哪里来
      </div>
      <div
        style={{
          ...center,
          width: 1000,
          marginLeft: -500,
          marginTop: 128,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 300,
          fontSize: 17,
          letterSpacing: '0.5em',
          color: C.dim,
          opacity: en,
        }}
      >
        WHERE THE SIXTEEN TYPES COME FROM
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// 2. 钩子：四个字母每拍翻一次 → 大字「16」
const LETTER_SETS = ['ENFP', 'ISTJ', 'ESFJ', 'INTP'];

export const HookScene: React.FC<{start: number}> = ({start}) => {
  const {frame, at} = useBeats(start);
  const flipIdx = Math.max(0, Math.min(3, [0, 1, 2, 3].filter((k) => frame >= at(k)).length - 1));
  const tilesOut = ramp(frame, at(4), 10);
  const sixteen = pop(frame, at(4), 30, 15);
  const ring = (k: number) => {
    const t = lerp(frame, at(k), at(k) + 26, 0, 1);
    return {scale: 0.6 + t * 1.2, opacity: (1 - t) * (frame >= at(k) ? 0.8 : 0)};
  };
  return (
    <AbsoluteFill>
      {/* 字母方块 */}
      <div
        style={{
          ...center,
          display: 'flex',
          gap: 28,
          transform: `translate(-50%, -62%) scale(${1 - tilesOut * 0.25})`,
          opacity: 1 - tilesOut,
        }}
      >
        {LETTER_SETS[flipIdx].split('').map((ch, i) => {
          const flip = ramp(frame, at(flipIdx) + i * 2, 8);
          return (
            <div
              key={i}
              style={{
                width: 150,
                height: 190,
                border: `1.5px solid ${C.goldSoft}`,
                background: 'rgba(232,194,106,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: SERIF,
                fontSize: 110,
                color: C.text,
                transform: `perspective(600px) rotateX(${(1 - flip) * 80}deg)`,
              }}
            >
              {ch}
            </div>
          );
        })}
      </div>
      {/* 16 + 脉冲圆环 */}
      {[4, 6].map((k) => {
        const r = ring(k);
        return (
          <div
            key={k}
            style={{
              ...center,
              width: 420,
              height: 420,
              marginLeft: -210,
              marginTop: -270,
              borderRadius: 420,
              border: `1.5px solid ${C.gold}`,
              opacity: r.opacity,
              transform: `scale(${r.scale})`,
            }}
          />
        );
      })}
      <div
        style={{
          ...center,
          width: 800,
          marginLeft: -400,
          marginTop: -235,
          textAlign: 'center',
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: 260,
          lineHeight: '330px',
          color: C.gold,
          opacity: frame >= at(4) ? Math.min(1, sixteen) : 0,
          transform: `scale(${0.7 + 0.3 * sixteen})`,
          textShadow: glow(C.gold, 30),
        }}
      >
        16
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// 3. 荣格：年份计数 → 一个点分成内倾/外倾 → 再出现两条维度
const YEARS = [1900, 1907, 1914, 1921];

const Axis: React.FC<{left: string; right: string; p: number; y: number; width?: number}> = ({
  left,
  right,
  p,
  y,
  width = 760,
}) => (
  <div style={{...center, marginTop: y, width, marginLeft: -width / 2, height: 40, opacity: p}}>
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 19,
        height: 1.5,
        background: C.line,
        transform: `scaleX(${p})`,
      }}
    />
    <GlowDot size={10} style={{position: 'absolute', left: 115, top: 15}} />
    <GlowDot size={10} style={{position: 'absolute', right: 115, top: 15}} />
    {[left, right].map((t, i) => (
      <div
        key={t}
        style={{
          position: 'absolute',
          [i === 0 ? 'left' : 'right']: 0,
          top: 0,
          width: 100,
          textAlign: i === 0 ? 'right' : 'left',
          fontFamily: SERIF,
          fontSize: 30,
          lineHeight: '40px',
          color: C.text,
        }}
      >
        {t}
      </div>
    ))}
  </div>
);

export const JungScene: React.FC<{start: number}> = ({start}) => {
  const {frame, at} = useBeats(start);
  const yearIdx = Math.max(0, [0, 1, 2, 3].filter((k) => frame >= at(k)).length - 1);
  const settle = pop(frame, at(4));
  const lift = ramp(frame, at(5), 16);
  const split = pop(frame, at(6), 30, 12);
  const ax1 = ramp(frame, at(8), 12);
  const ax2 = ramp(frame, at(9), 12);
  const final = frame >= at(4);
  return (
    <AbsoluteFill>
      <div
        style={{
          ...center,
          width: 900,
          marginLeft: -450,
          marginTop: -150 - lift * 190,
          textAlign: 'center',
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: 200 - lift * 110,
          lineHeight: 1,
          color: final ? C.gold : C.text,
          textShadow: final ? glow(C.gold, 20 * settle) : 'none',
          opacity: 0.35 + 0.65 * ramp(frame, at(yearIdx), 6),
        }}
      >
        {YEARS[yearIdx]}
      </div>
      <div
        style={{
          ...center,
          width: 900,
          marginLeft: -450,
          marginTop: -190 + 64,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 300,
          fontSize: 18,
          letterSpacing: '0.45em',
          color: C.dim,
          opacity: lift,
        }}
      >
        C. G. JUNG · PSYCHOLOGICAL TYPES
      </div>

      {/* 一个点分成两个 */}
      {[-1, 1].map((s) => (
        <React.Fragment key={s}>
          <GlowDot
            size={22}
            style={{
              ...center,
              marginLeft: -11 + s * split * 300,
              marginTop: -40,
              opacity: frame >= at(6) - 4 ? ramp(frame, at(6) - 4, 6) : 0,
            }}
          />
          <div
            style={{
              ...center,
              width: 220,
              marginLeft: -110 + s * split * 300,
              marginTop: 0,
              textAlign: 'center',
              fontFamily: SERIF,
              fontSize: 40,
              color: C.text,
              opacity: ramp(frame, at(6) + 4, 10),
            }}
          >
            {s < 0 ? '内倾 I' : '外倾 E'}
          </div>
        </React.Fragment>
      ))}
      <div
        style={{
          ...center,
          marginTop: -30,
          width: split * 560,
          marginLeft: (-split * 560) / 2,
          height: 1.5,
          background: `linear-gradient(90deg, ${C.goldSoft}, rgba(232,194,106,0.05), ${C.goldSoft})`,
        }}
      />
      <Axis left="感觉 S" right="直觉 N" p={ax1} y={90} />
      <Axis left="思维 T" right="情感 F" p={ax2} y={160} />
    </AbsoluteFill>
  );
};

// ============================================================================
// 4. 母女问卷：问卷卡逐行勾选 → 名字 → 1943
export const BriggsScene: React.FC<{start: number}> = ({start}) => {
  const {frame, at} = useBeats(start);
  const card = ramp(frame, 0, 12);
  const shift = ramp(frame, at(6), 16);
  const names = ramp(frame, at(6) + 4, 14);
  const year = pop(frame, at(8), 30, 14);
  const jp = ramp(frame, at(9), 12);
  const rows = ['我更喜欢先计划，再行动', '独处让我恢复精力', '我相信直觉多过经验', '做决定时我先讲道理', '截止日期让我安心'];
  return (
    <AbsoluteFill>
      {/* 问卷卡 */}
      <div
        style={{
          ...center,
          width: 620,
          height: 420,
          marginLeft: -310 - shift * 330,
          marginTop: -250,
          border: `1.5px solid ${C.goldSoft}`,
          background: 'rgba(12,18,32,0.6)',
          opacity: card,
          transform: `translateY(${(1 - card) * 20}px)`,
          padding: '34px 40px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{fontFamily: SANS, fontSize: 15, letterSpacing: '0.4em', color: C.dim}}>
          TYPE INDICATOR · FORM A
        </div>
        <div style={{height: 1, background: C.line, margin: '16px 0 22px'}} />
        {rows.map((r, i) => {
          const p = ramp(frame, at(i), 8);
          return (
            <div key={r} style={{display: 'flex', alignItems: 'center', gap: 18, height: 58, opacity: 0.3 + 0.7 * p}}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  border: `1.5px solid ${C.gold}`,
                  background: p > 0.5 ? C.gold : 'transparent',
                  boxShadow: p > 0.5 ? glow(C.gold, 6) : 'none',
                  transform: `scale(${1 + (p > 0 && p < 1 ? 0.25 : 0)})`,
                }}
              />
              <div style={{fontFamily: SERIF, fontSize: 26, color: C.text}}>{r}</div>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: C.line,
                  transform: `scaleX(${p})`,
                  transformOrigin: 'left',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 母女名字 */}
      <div
        style={{
          ...center,
          marginLeft: 120,
          marginTop: -262,
          width: 640,
          opacity: names,
          transform: `translateX(${(1 - names) * 30}px)`,
        }}
      >
        {[
          ['凯瑟琳 · 布里格斯', 'KATHARINE COOK BRIGGS'],
          ['伊莎贝尔 · 布里格斯 · 迈尔斯', 'ISABEL BRIGGS MYERS'],
        ].map(([zh, en]) => (
          <div key={en} style={{marginBottom: 26}}>
            <div style={{fontFamily: SERIF, fontSize: 38, color: C.text}}>{zh}</div>
            <div style={{fontFamily: SANS, fontWeight: 300, fontSize: 15, letterSpacing: '0.35em', color: C.dim, marginTop: 6}}>
              {en}
            </div>
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 22,
            marginTop: 18,
            opacity: frame >= at(8) ? Math.min(1, year) : 0,
          }}
        >
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 500,
              fontSize: 110,
              lineHeight: 1,
              color: C.gold,
              textShadow: glow(C.gold, 22),
              transform: `scale(${0.8 + 0.2 * year})`,
              transformOrigin: 'left bottom',
            }}
          >
            1943
          </div>
          <div style={{fontFamily: SERIF, fontSize: 28, color: C.text}}>第一版问卷</div>
        </div>
        <div style={{marginTop: 20, fontFamily: SERIF, fontSize: 30, color: C.gold, opacity: jp, letterSpacing: '0.1em'}}>
          + 判断 J ⟷ 感知 P
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// 5. 二叉分裂：1 → 2 → 4 → 8 → 16
const LEVEL_X = [330, 650, 970, 1290, 1610];
const LEVEL_LABEL = ['', 'E / I', 'S / N', 'T / F', 'J / P'];
const nodeY = (level: number, i: number) => {
  const n = 2 ** level;
  const top = 250;
  const bottom = 800;
  return n === 1 ? (top + bottom) / 2 : top + ((bottom - top) * (i + 0.5)) / n;
};

export const TreeScene: React.FC<{start: number}> = ({start}) => {
  const {frame, at} = useBeats(start);
  const levelAt = (l: number) => at(l * 2);
  const visible = [0, 1, 2, 3, 4].filter((l) => frame >= levelAt(l) - 2);
  const count = 2 ** (visible.length - 1);
  const countPop = pop(frame, levelAt(visible.length - 1));
  const final = ramp(frame, at(8), 14);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {[1, 2, 3, 4].map((l) =>
          Array.from({length: 2 ** l}).map((_, i) => {
            const p = ramp(frame, levelAt(l) - 3, 10);
            if (p <= 0) return null;
            const x1 = LEVEL_X[l - 1];
            const y1 = nodeY(l - 1, Math.floor(i / 2));
            const x2 = LEVEL_X[l];
            const y2 = nodeY(l, i);
            const mx = (x1 + x2) / 2;
            const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
            return (
              <path
                key={`${l}-${i}`}
                d={d}
                fill="none"
                stroke={l === 4 ? 'rgba(232,194,106,0.45)' : C.line}
                strokeWidth={1.5}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
              />
            );
          })
        )}
      </svg>
      {visible.map((l) =>
        Array.from({length: 2 ** l}).map((_, i) => {
          const s = pop(frame, levelAt(l) + 4);
          const size = [22, 18, 15, 12, 10][l];
          return (
            <GlowDot
              key={`${l}-${i}`}
              size={size}
              style={{
                position: 'absolute',
                left: LEVEL_X[l] - size / 2,
                top: nodeY(l, i) - size / 2,
                transform: `scale(${s * (l === 4 ? 1 + final * 0.4 : 1)})`,
                opacity: l < 4 ? 1 - final * 0.4 : 1,
              }}
            />
          );
        })
      )}
      {/* 每层上方的维度标签 */}
      {[1, 2, 3, 4].map((l) => (
        <div
          key={l}
          style={{
            position: 'absolute',
            left: LEVEL_X[l] - 100,
            top: 168,
            width: 200,
            textAlign: 'center',
            fontFamily: SERIF,
            fontSize: 28,
            letterSpacing: '0.12em',
            color: C.gold,
            opacity: ramp(frame, levelAt(l), 10),
          }}
        >
          {LEVEL_LABEL[l]}
        </div>
      ))}
      {/* 左上计数器 */}
      <div style={{position: 'absolute', left: 130, top: 150, fontFamily: SERIF, color: C.gold}}>
        <span
          style={{
            display: 'inline-block',
            fontSize: 120,
            fontWeight: 500,
            lineHeight: 1,
            textShadow: glow(C.gold, 18),
            transform: `scale(${0.85 + 0.15 * countPop})`,
            transformOrigin: 'left bottom',
          }}
        >
          {count}
        </span>
        <span style={{fontSize: 28, color: C.dim, marginLeft: 14}}>种</span>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// 6. 16 宫格
export const GridScene: React.FC<{start: number}> = ({start}) => {
  const {frame, at} = useBeats(start);
  const sweep = lerp(frame, at(5), at(6) + 4, -0.2, 1.2);
  const pulse = ramp(frame, at(6), 6) * (1 - ramp(frame, at(6) + 8, 20));
  const cw = 250;
  const ch = 104;
  const gap = 22;
  const gw = 4 * cw + 3 * gap;
  return (
    <AbsoluteFill>
      <div style={{...center, width: gw, marginLeft: -gw / 2, marginTop: -330}}>
        {TYPES.map((row, r) => (
          <div key={r} style={{display: 'flex', gap, marginBottom: gap}}>
            {row.map((t, c) => {
              const p = pop(frame, at(r) + c * 2, 30, 14);
              const pos = (c + r * 0.5) / 5;
              const lit = Math.max(0, 1 - Math.abs(sweep - pos) * 5) + pulse;
              return (
                <div
                  key={t.code}
                  style={{
                    width: cw,
                    height: ch,
                    border: `1.5px solid rgba(232,194,106,${0.22 + 0.5 * lit})`,
                    background: `rgba(232,194,106,${0.03 + 0.08 * lit})`,
                    boxShadow: lit > 0.05 ? `0 0 ${24 * lit}px rgba(232,194,106,${0.35 * lit})` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: frame >= at(r) + c * 2 ? Math.min(1, p) : 0,
                    transform: `translateY(${(1 - Math.min(1, p)) * 16}px)`,
                  }}
                >
                  <div style={{fontFamily: SERIF, fontWeight: 500, fontSize: 40, letterSpacing: '0.12em', color: C.gold}}>
                    {t.code}
                  </div>
                  <div style={{fontFamily: SANS, fontWeight: 300, fontSize: 18, letterSpacing: '0.2em', color: C.dim}}>
                    {t.name}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// 7. 结尾：收成一个点 → 16 颗星围成一圈 → 片尾
export const EndingScene: React.FC<{start: number}> = ({start}) => {
  const {frame, at} = useBeats(start);
  const ring = ramp(frame, at(4), 24);
  const spin = frame / 240;
  const endTitle = ramp(frame, at(8), 16);
  const fadeAll = 1 - lerp(frame, at(12), at(14), 0, 1);
  const radius = 230 + ring * 30;
  return (
    <AbsoluteFill style={{opacity: fadeAll}}>
      <GlowDot
        size={24}
        style={{...center, marginLeft: -12, marginTop: -132, transform: `scale(${pop(frame, 0) * (1 - endTitle * 0.3)})`}}
      />
      {Array.from({length: 16}).map((_, i) => {
        const a = (i / 16) * Math.PI * 2 + spin;
        const r = radius * ring;
        return (
          <GlowDot
            key={i}
            size={9}
            style={{
              ...center,
              marginLeft: Math.cos(a) * r - 4.5,
              marginTop: -120 + Math.sin(a) * r * 0.55 - 4.5,
              opacity: ring * (0.5 + 0.5 * Math.sin(frame / 9 + i)),
            }}
          />
        );
      })}
      <div
        style={{
          ...center,
          marginTop: -120,
          width: radius * 2 * ring,
          height: radius * 1.1 * ring,
          marginLeft: -radius * ring,
          transform: 'translateY(-50%)',
          borderRadius: '50%',
          border: `1px solid rgba(232,194,106,${0.18 * ring})`,
        }}
      />
      <div
        style={{
          ...center,
          width: 1000,
          marginLeft: -500,
          marginTop: 130,
          textAlign: 'center',
          opacity: endTitle,
        }}
      >
        <div style={{fontFamily: SERIF, fontSize: 30, letterSpacing: '0.5em', color: C.gold}}>十六型人格 · 完</div>
        <div
          style={{
            marginTop: 18,
            fontFamily: SANS,
            fontWeight: 300,
            fontSize: 20,
            letterSpacing: '0.2em',
            color: C.dim,
          }}
        >
          下一集：你的四个字母，到底准不准？
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SCENE_COMPONENTS = {
  title: TitleScene,
  hook: HookScene,
  jung: JungScene,
  briggs: BriggsScene,
  tree: TreeScene,
  grid: GridScene,
  ending: EndingScene,
};

