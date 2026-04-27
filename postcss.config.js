import postcssPresetEnv from 'postcss-preset-env'
import postcssImport from 'postcss-import'

export default {
  plugins: [
    postcssImport(),
    postcssPresetEnv({
      stage: 0,
      browsers: [
        'last 3 chrome version',
        'last 3 firefox version',
      ],
    }),
  ]
}
