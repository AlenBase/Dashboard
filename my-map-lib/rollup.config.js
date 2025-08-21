import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/MapPlot.jsx',
  // Выдаём два формата: esm и cjs
  output: [
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    }
  ],
  // Любые импорты react и react-dom не ложатся в бандл
  external: id => /^(react|react-dom)(\/|$)/.test(id),
  plugins: [
    // 1) выносит peerDeps в external
    peerDepsExternal(),
    // 2) позволяет резолвить .jsx файлы
    resolve({ extensions: ['.js', '.jsx'] }),
    // 3) импорт CSS прямо в JS
    postcss({
      extensions: ['.css'],
      extract: false,
      inject: true
    }),
    // 4) транспиляция через Babel + runtime
    babel({
      babelHelpers: 'runtime',
      extensions: ['.js', '.jsx'],
      exclude: /node_modules/,
      presets: ['@babel/preset-env', '@babel/preset-react'],
      plugins: ['@babel/plugin-transform-runtime']
    })
  ]
};
