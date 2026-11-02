"""视频 2、3 那类「忧郁氛围片」的一键卡点剪辑：按拍切镜 + 冷青调色 + 宽字距片名。

  python3 tools/beatcut.py --music 配乐.mp3 --clips 素材文件夹/ --out out/mood.mp4

常用参数：
  --pattern 2        每个镜头几拍；可写序列循环使用，例如 "2,2,4"（视频 3 的节奏）或 "4"（视频 2 的节奏）
  --skip-beats 0     从第几拍开始踩（跳过前奏）
  --shots N          镜头数，默认 = 素材数
  --title ABYSS      开头片名（空字符串则不加）；--watermark 片中水印文字
  --no-wipe          关闭开头黑幕揭开
  --grade abyss|none 调色预设
  --size 1920x1080   竖屏用 1080x1920
  --font 字体文件     片名字体（默认找系统衬线字体）

素材按文件名排序依次使用；镜头比素材长时自动循环。依赖 ffmpeg、librosa。
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
VIDEO_EXT = ('.mp4', '.mov', '.m4v', '.mkv', '.webm', '.avi')
FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSerif.ttf',
    '/System/Library/Fonts/Supplemental/Times New Roman.ttf',
    '/Library/Fonts/Times New Roman.ttf',
    'C:/Windows/Fonts/times.ttf',
]

GRADES = {
    # 压暗、降饱和、阴影偏青、高光压住、暗角、细颗粒
    'abyss': ','.join([
        'eq=brightness=-0.05:contrast=1.08:saturation=0.5:gamma=0.92',
        'colorbalance=rs=-0.06:gs=0.01:bs=0.07:rm=-0.04:bm=0.04:rh=-0.03:bh=0.02',
        "curves=all='0/0.02 0.5/0.42 1/0.85'",
        'vignette=PI/4.5',
        'noise=alls=5:allf=t+u',
    ]),
    'none': 'null',
}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.stderr.write(' '.join(cmd) + '\n' + r.stderr[-2000:])
        raise SystemExit(f'命令失败：{cmd[0]}')
    return r.stdout


def duration_of(path):
    out = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path])
    return float(out.strip())


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--music', required=True)
    ap.add_argument('--clips', required=True)
    ap.add_argument('--out', default='out/mood.mp4')
    ap.add_argument('--pattern', default='2')
    ap.add_argument('--skip-beats', type=int, default=0)
    ap.add_argument('--shots', type=int, default=0)
    ap.add_argument('--title', default='ABYSS')
    ap.add_argument('--watermark', default='ABYSS')
    ap.add_argument('--no-wipe', action='store_true')
    ap.add_argument('--grade', default='abyss', choices=list(GRADES))
    ap.add_argument('--size', default='1920x1080')
    ap.add_argument('--font', default='')
    a = ap.parse_args()

    W, H = (int(v) for v in a.size.lower().split('x'))
    clips = sorted(p for p in glob.glob(os.path.join(a.clips, '*')) if p.lower().endswith(VIDEO_EXT))
    if not clips:
        raise SystemExit(f'{a.clips} 里没有视频素材')
    pattern = [int(x) for x in a.pattern.split(',')]
    n_shots = a.shots or len(clips)
    font = a.font or next((f for f in FONT_CANDIDATES if os.path.exists(f)), '')

    work = tempfile.mkdtemp(prefix='beatcut_')
    try:
        # 1) 测拍
        beats_json = os.path.join(work, 'beats.json')
        run([sys.executable, os.path.join(HERE, 'analyze_beats.py'), a.music, '--out', beats_json, '--fps', str(FPS)])
        beats = json.load(open(beats_json))
        bt = beats['beats']
        print(f"配乐 {beats['bpm']} BPM，{len(bt)} 拍")

        # 2) 算每个镜头的起止帧：第 1 镜从 0 秒开始，之后每个切点都落在拍上
        bounds = [0.0]
        k = a.skip_beats
        for i in range(n_shots):
            k += pattern[i % len(pattern)]
            if k >= len(bt):
                print(f'音乐只够 {i} 个镜头，后面的素材不用了')
                break
            bounds.append(bt[k])
        frames = [round(t * FPS) for t in bounds]
        print('切点（秒）：', ', '.join(f'{t:.2f}' for t in bounds[1:]))

        # 3) 每个镜头：取素材中段、裁成目标画幅、调色
        grade = GRADES[a.grade]
        parts = []
        for i in range(len(frames) - 1):
            nf = frames[i + 1] - frames[i]
            need = nf / FPS
            src = clips[i % len(clips)]
            dur = duration_of(src)
            offset = max(0.0, (dur - need) / 2) if dur > need else 0.0
            part = os.path.join(work, f'shot_{i:03d}.mp4')
            vf = (f'scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,'
                  f'fps={FPS},{grade},format=yuv420p')
            run(['ffmpeg', '-v', 'error', '-y', '-stream_loop', '-1', '-ss', f'{offset:.3f}', '-i', src,
                 '-vf', vf, '-frames:v', str(nf), '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'fast', part])
            parts.append(part)
            print(f'  镜头 {i + 1}: {os.path.basename(src)}  {need:.2f}s')

        listfile = os.path.join(work, 'list.txt')
        with open(listfile, 'w') as f:
            f.writelines(f"file '{p}'\n" for p in parts)
        joined = os.path.join(work, 'joined.mp4')
        run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listfile, '-c', 'copy', joined])

        # 4) 片名 / 水印 / 开头黑幕揭开 + 配乐
        total = frames[-1] / FPS
        first_cut = bounds[1] if len(bounds) > 1 else total
        filters = ['[0:v]null[v0]']
        last = 'v0'
        if not a.no_wipe:
            # 一块黑幕从左往右滑开，在第一个切点前完全揭开
            s, e = 0.25, max(0.5, first_cut - 0.15)
            filters.append(f'color=black:s={W}x{H}:r={FPS}:d={total:.3f}[blk]')
            filters.append(f"[{last}][blk]overlay=x='if(lt(t,{s}),0,{W}*min(1,(t-{s})/{e - s})^1.6)':y=0:shortest=1[v1]")
            last = 'v1'
        esc = lambda txt: txt.replace("'", "").replace(':', '\\:')  # noqa: E731
        if a.title and font:
            spaced = ' '.join(a.title)
            t_out = max(1.0, first_cut - 0.1)
            alpha = (f"if(lt(t,0.2),0,if(lt(t,0.9),(t-0.2)/0.7*0.6,"
                     f"if(lt(t,{t_out - 0.4:.2f}),0.6,max(0,0.6-(t-{t_out - 0.4:.2f})/0.4*0.6))))")
            filters.append(
                f"[{last}]drawtext=fontfile='{font}':text='{esc(spaced)}':fontsize={int(H * 0.042)}:"
                f"fontcolor=white:alpha='{alpha}':x=(w-text_w)/2:y=(h-text_h)/2[v2]")
            last = 'v2'
        if a.watermark and font:
            filters.append(
                f"[{last}]drawtext=fontfile='{font}':text='{esc(a.watermark)}':fontsize={int(H * 0.016)}:"
                f"fontcolor=white:alpha='if(lt(t,{first_cut:.2f}),0,0.28)':x=(w-text_w)/2:y=h-text_h-{int(H * 0.035)}[v3]")
            last = 'v3'
        filters.append(f'[1:a]atrim=0:{total:.3f},afade=t=in:d=0.3,afade=t=out:st={max(0, total - 1.2):.3f}:d=1.2[a]')

        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        run(['ffmpeg', '-v', 'error', '-y', '-i', joined, '-i', a.music, '-filter_complex', ';'.join(filters),
             '-map', f'[{last}]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
             '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', a.out])
        print(f'完成：{a.out}（{total:.1f} 秒，{len(parts)} 个镜头）')
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == '__main__':
    main()
