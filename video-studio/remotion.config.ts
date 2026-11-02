import {Config} from '@remotion/cli/config';
Config.setEntryPoint('src/index.ts');
import fs from 'fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setConcurrency(4);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(18);

// 云端环境里用预装的浏览器；在你自己电脑上 Remotion 会自动下载，不受影响
const preinstalled =
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (fs.existsSync(preinstalled)) {
  Config.setBrowserExecutable(preinstalled);
}
