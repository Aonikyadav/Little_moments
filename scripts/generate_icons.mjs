import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const svgPath = path.resolve('src/assets/lm-logo.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

const targets = [
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png', size: 48 },
  { path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', size: 48 },
  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png', size: 72 },
  { path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', size: 72 },
  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', size: 96 },
  { path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', size: 96 },
  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', size: 144 },
  { path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', size: 144 },
  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', size: 192 },
  { path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', size: 192 },
  { path: 'android/app/src/main/res/drawable/splash.png', size: 512 },
  { path: 'android/app/src/main/res/drawable-port-xxxhdpi/splash.png', size: 512 },
  { path: 'android/app/src/main/res/drawable-land-xxxhdpi/splash.png', size: 512 },
  { path: 'public/icon.png', size: 512 },
  { path: 'public/lm-logo.png', size: 512 },
];

for (const target of targets) {
  const fullPath = path.resolve(target.path);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: target.size,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(fullPath, pngBuffer);
  console.log(`Generated: ${target.path} (${target.size}x${target.size})`);
}
console.log('All icons and splash drawables generated successfully!');
