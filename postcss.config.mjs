import postcssImport from 'postcss-import'
import postcssPresetEnv from 'postcss-preset-env'

export default {
  plugins: [
    postcssImport(),
    postcssPresetEnv({
      stage: 2,
      browsers: [
        'chrome >= 86',
        'firefox >= 79',
        'safari >= 14.1',
        'edge >= 86',
      ],
    }),
  ],
}
