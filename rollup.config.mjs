import { nodeResolve } from '@rollup/plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'
import terser from '@rollup/plugin-terser'

const isProd = process.env.build === 'prod'

const plugins = [
  nodeResolve({
    browser: true,
  }),
  postcss({
    extract: false,
    inject: false,
  }),
  ...(isProd ? [terser()] : []),
]

export default {
  input: 'app/index.js',
  output: {
    file: isProd ? 'app/bundle.min.js' : 'app/bundle.js',
    format: 'es',
    sourcemap: isProd ? false : 'inline',
  },
  plugins,
  watch: {
    exclude: ['node_modules/**'],
  },
}
