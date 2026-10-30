import { build } from 'vite';
import { resolve } from 'node:path';

const games = [
  'among-us-pixel-outpost',
  'bloom-loop',
  'cash-tycoon',
  'flappy-bird-3d',
  'pixels-farm-craft',
  'shop-tycoon',
];

for (const slug of games) {
  const root = resolve('standalone-games', slug);
  console.log(`Building ${slug}...`);
  await build({
    root,
    configFile: resolve(root, 'vite.config.ts'),
    base: `/embedded/${slug}/`,
    build: {
      outDir: resolve('public', 'embedded', slug),
      emptyOutDir: true,
    },
  });
}
