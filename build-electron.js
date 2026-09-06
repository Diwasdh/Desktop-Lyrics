import * as esbuild from 'esbuild';
import * as path from 'path';

async function buildElectron() {
  // Build Main process
  await esbuild.build({
    entryPoints: ['src/main/main.ts'],
    outfile: 'dist-electron/main.js',
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    external: ['electron'],
    sourcemap: true,
  });

  // Build Preload script
  await esbuild.build({
    entryPoints: ['src/preload/preload.ts'],
    outfile: 'dist-electron/preload.cjs',
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    external: ['electron'],
    sourcemap: true,
  });

  console.log('Electron main & preload built successfully.');
}

buildElectron().catch((err) => {
  console.error(err);
  process.exit(1);
});
