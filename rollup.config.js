import rollupTypescript from 'rollup-plugin-typescript'
import { uglify as rollupUglify } from 'rollup-plugin-uglify'

const inputs = [
  ['src/MSEPlayer.ts', 'MSEPlayer'],
  ['src/pcmToWav.ts', 'pcmToWav']
]

const formats = [
  'esm',
  'umd'
]

function genConfigs () {
  return inputs.reduce((acc, [input, name]) => [...acc, ...formats.reduce((acc, format) => {
    const config = {
      input,
      plugins: [rollupTypescript()],
      output: {
        name,
        format,
        sourcemap: true,
        file: `dist/${name}.${format}.js`
      }
    }

    const configs = [...acc, config]
    // `uglifyjs` doesn't support es6
    // `esm` format will generate `export default`
    if (format !== 'esm') {
      const compactConfig = {
        ...config,
        plugins: [...config.plugins, rollupUglify()],
        output: { ...config.output, file: `dist/${name}.${format}.min.js` }
      }
      configs.push(compactConfig)
    }

    return configs
  }, [])], [])
}

const configs = genConfigs()

export default configs
