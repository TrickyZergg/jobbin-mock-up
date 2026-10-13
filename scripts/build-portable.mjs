// A portable static build for restricted Windows environments.
// Vite remains the primary development/build tool; both compile the same sources.
import { build } from 'esbuild';
import * as sass from 'sass';
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
await mkdir(path.join(root, 'dist/assets'), { recursive: true });
await build({
  entryPoints: ['src/main.tsx'], bundle: true, minify: true, sourcemap: true,
  outfile: 'dist/assets/app.js', format: 'esm', target: 'es2022', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.VITE_API_URL': '""' },
  loader: { '.woff': 'file', '.woff2': 'file' }, assetNames: '[name]-[hash]',
  plugins: [{ name: 'portable-scss', setup(builder) { builder.onLoad({ filter: /\.scss$/ }, async args => ({ contents: sass.compile(args.path, { style: 'compressed', loadPaths: ['node_modules'] }).css, loader: 'css', resolveDir: path.dirname(args.path) })); } }],
});
const html = (await readFile('index.html', 'utf8')).replace('<script type="module" src="/src/main.tsx"></script>', '<link rel="stylesheet" href="/assets/app.css"/><script type="module" src="/assets/app.js"></script>');
await writeFile('dist/index.html', html);
await cp('public', 'dist', { recursive: true });
console.log('Portable production build created in dist/.');
